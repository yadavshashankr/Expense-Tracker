# CORS Solution Guide for Google Apps Script

## Problem
You're experiencing CORS (Cross-Origin Resource Sharing) errors when trying to access your Google Apps Script from GitHub Pages:
```
Access to fetch at 'https://script.google.com/macros/s/...' from origin 'https://yadavshashankr.github.io' has been blocked by CORS policy
```

## Solution 1: Fix Google Apps Script Deployment Settings (RECOMMENDED)

### Step 1: Update Deployment Settings
1. Go to your Google Apps Script project
2. Click on "Deploy" → "Manage deployments"
3. Click on the pencil icon to edit your deployment
4. Set the following:
   - **Execute as**: "Me" (your Google account)
   - **Who has access**: "Anyone" (this is crucial for CORS)
5. Click "Update"

### Step 2: Remove OAuth2 Conflicts
1. Go to Google Cloud Console
2. Navigate to your project's OAuth2 settings
3. Remove any conflicting authorized JavaScript origins
4. Remove any conflicting redirect URLs
5. Save changes

### Step 3: Redeploy
1. In Apps Script, go to "Deploy" → "New deployment"
2. Choose "Web app"
3. Set the same settings as above
4. Deploy and get the new URL

## Solution 2: Alternative Frontend Approach

If Solution 1 doesn't work, try this alternative approach in your frontend:

```javascript
// Alternative approach using Google Apps Script's JSONP-like behavior
async function callAppsScript(action, data) {
  try {
    // Create a unique callback name
    const callbackName = 'callback_' + Date.now();
    
    // Create a promise that resolves when the callback is called
    const promise = new Promise((resolve, reject) => {
      window[callbackName] = (result) => {
        delete window[callbackName];
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      };
    });
    
    // Create script tag to load the Apps Script
    const script = document.createElement('script');
    script.src = `${APPS_SCRIPT_URL}?callback=${callbackName}&action=${action}&data=${encodeURIComponent(JSON.stringify(data))}`;
    document.head.appendChild(script);
    
    // Clean up script tag after a timeout
    setTimeout(() => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    }, 10000);
    
    return await promise;
  } catch (error) {
    console.error(`Error calling Apps Script (${action}):`, error);
    throw new Error(`Apps Script call failed: ${error.message}`);
  }
}
```

## Solution 3: Use Google Apps Script's doGet for Simple Operations

For read-only operations, you can use GET requests which have fewer CORS restrictions:

```javascript
// For getExpenses, use GET request
export async function getExpenses(userEmail) {
  try {
    const url = `${APPS_SCRIPT_URL}?action=getExpenses&userEmail=${encodeURIComponent(userEmail)}`;
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
}
```

## Solution 4: Use a CORS Proxy (Temporary Solution)

As a temporary workaround, you can use a CORS proxy:

```javascript
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

async function callAppsScript(action, data) {
  try {
    const response = await fetch(CORS_PROXY + APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://yadavshashankr.github.io'
      },
      body: JSON.stringify({
        action,
        ...data
      })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error calling Apps Script (${action}):`, error);
    throw error;
  }
}
```

## Solution 5: Update Apps Script to Handle CORS Properly

**IMPORTANT**: Google Apps Script's `ContentService` does NOT support the `setHeaders()` method. The correct approach is to rely on Google Apps Script's automatic CORS handling when deployed as a web app.

Update your Apps Script `doPost` function:

```javascript
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: 'Invalid request: missing postData'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    switch(action) {
      case 'addExpense':
        result = addExpense(data);
        break;
      case 'getExpenses':
        result = getExpenses(data);
        break;
      // ... other cases
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

**Key Points:**
- Remove any `setHeaders()` calls - they don't exist in Google Apps Script
- Google Apps Script automatically handles CORS when deployed as a web app with "Anyone" access
- Focus on proper JSON responses with correct MIME type

## Testing Your Fix

1. **Test the Apps Script directly**: Visit your Apps Script URL in a browser
2. **Test with curl**: 
   ```bash
   curl -X POST -H "Content-Type: application/json" \
        -d '{"action":"test","data":"test"}' \
        https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. **Test from your local development server**: Run `npm run dev` and test locally first

## Common Issues and Solutions

### Issue: "Who has access" is set to "Only myself"
**Solution**: Change to "Anyone" in deployment settings

### Issue: OAuth2 authorized origins conflict
**Solution**: Remove all OAuth2 origins and redirect URLs, let Apps Script handle authentication

### Issue: Script returns HTML instead of JSON
**Solution**: Ensure your Apps Script returns proper JSON with correct MIME type

### Issue: Preflight OPTIONS request fails
**Solution**: Implement proper `doOptions` function in Apps Script

## Recommended Approach

1. **Start with Solution 1** (fix deployment settings)
2. **If that doesn't work**, try Solution 5 (update Apps Script CORS handling)
3. **As a last resort**, use Solution 4 (CORS proxy)

The key is ensuring your Google Apps Script deployment is set to "Anyone" access, which should automatically handle CORS for web requests. 
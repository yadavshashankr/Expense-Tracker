# CORS Fix Guide for Google Apps Script

## The Problem
You're getting CORS errors when trying to access your Google Apps Script from `yadavshashankr.github.io`:
```
Access to fetch at 'https://script.google.com/macros/s/...' from origin 'https://yadavshashankr.github.io' has been blocked by CORS policy
```

## Solution Steps

### Step 1: Fix Deployment Settings

1. **Go to your Google Apps Script project**
2. **Click "Deploy" > "Manage deployments"**
3. **Click the edit icon (pencil) next to your deployment**
4. **Change these settings:**
   - **Execute as**: "Me" (your Google account)
   - **Who has access**: "Anyone" (CRITICAL!)
5. **Click "Update"**
6. **Authorize the app again if prompted**

### Step 2: Alternative - Create New Deployment

If the above doesn't work:

1. **Delete the current deployment**
2. **Click "Deploy" > "New deployment"**
3. **Choose "Web app"**
4. **Set configuration:**
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
5. **Click "Deploy"**
6. **Authorize when prompted**
7. **Copy the new Web app URL**

### Step 3: Test the Deployment

After updating settings, test your URL directly in browser:
- Should show JSON response (not sign-in page)
- Should work without CORS errors

### Step 4: Update Frontend URL

If you get a new URL, update `src/services/appsScript.js`:
```javascript
const APPS_SCRIPT_URL = 'YOUR_NEW_URL_HERE';
```

## Why This Happens

1. **"Anyone" Access Required**: Without this setting, Google Apps Script blocks cross-origin requests
2. **Preflight Requests**: Browsers send OPTIONS requests that need proper handling
3. **Domain Restrictions**: Google Apps Script needs to allow your GitHub Pages domain

## Alternative Solutions

### Option 1: Use JSONP (if CORS persists)
```javascript
// Add this to your Apps Script
function doGet(e) {
  const callback = e.parameter.callback || 'callback';
  const data = { status: 'success', message: 'Hello from Apps Script' };
  return ContentService.createTextOutput(`${callback}(${JSON.stringify(data)})`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
```

### Option 2: Use a CORS Proxy
```javascript
// In your frontend service
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const APPS_SCRIPT_URL = CORS_PROXY + 'YOUR_APPS_SCRIPT_URL';
```

### Option 3: Deploy to Different Platform
Consider deploying your backend to:
- Firebase Functions
- Vercel Functions
- Netlify Functions

## Testing Checklist

- [ ] Apps Script URL shows JSON response (not sign-in page)
- [ ] No CORS errors in browser console
- [ ] Frontend can make requests successfully
- [ ] Cross-user functionality works
- [ ] Sheets are created in Google Drive

## Common Issues

1. **Still seeing sign-in page**: Deployment not set to "Anyone"
2. **CORS errors persist**: Try creating new deployment
3. **Authorization errors**: Re-authorize the app
4. **Network errors**: Check if URL is correct

## Next Steps

1. Fix deployment settings
2. Test the URL directly
3. Update frontend if needed
4. Test complete functionality
5. Deploy to GitHub Pages

---

**Note**: The "Anyone" access setting is crucial for cross-origin requests to work properly. 
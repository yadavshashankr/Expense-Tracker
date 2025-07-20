# Google Apps Script CORS Handling Guide

## Correct CORS Implementation Pattern

Google Apps Script automatically adds CORS headers when your functions explicitly return `ContentService.createTextOutput()` or `HtmlService.createHtmlOutput()`. Here's the correct pattern:

### 1. Main Entry Points (doGet, doPost, doOptions)

```javascript
/**
 * Handle GET requests
 */
function doGet(e) {
  const data = { 
    status: "Backend is running", 
    timestamp: new Date().toISOString() 
  };
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    let result;
    switch(action) {
      case 'addExpense':
        result = addExpense(requestData);
        break;
      case 'getExpenses':
        result = getExpenses(requestData);
        break;
      // ... other cases
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle OPTIONS requests (CORS preflight)
 */
function doOptions(e) {
  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

### 2. Internal Functions

Internal functions that are called by the main entry points can return plain objects, but they should be wrapped in `ContentService.createTextOutput()` in the main entry points:

```javascript
/**
 * Internal function - returns plain object
 */
function addExpense(data) {
  try {
    // ... business logic ...
    return { 
      success: true, 
      message: 'Expense added successfully' 
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * Test function - should return ContentService output
 */
function testBackend() {
  try {
    // ... test logic ...
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Test completed'
    }))
    .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Key Points

### ✅ DO:
- Return `ContentService.createTextOutput()` from main entry points (`doGet`, `doPost`, `doOptions`)
- Use `.setMimeType(ContentService.MimeType.JSON)` for JSON responses
- Use `.setMimeType(ContentService.MimeType.TEXT)` for text responses
- Handle errors by returning proper ContentService output

### ❌ DON'T:
- Use `setHeaders()` method - it doesn't exist in Google Apps Script
- Return plain objects from main entry points
- Forget to set the correct MIME type
- Return HTML or other content types without proper handling

## Deployment Settings

For CORS to work properly, ensure your deployment settings are:

1. **Execute as**: "Me" (your Google account)
2. **Who has access**: "Anyone" (crucial for CORS)

## Testing

### Test GET requests:
```bash
curl https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Test POST requests:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"action":"test","data":"test"}' \
  https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Test OPTIONS requests:
```bash
curl -X OPTIONS \
  -H "Origin: https://yadavshashankr.github.io" \
  https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Common Issues and Solutions

### Issue: "setHeaders is not a function"
**Solution**: Remove `setHeaders()` calls - Google Apps Script doesn't support this method

### Issue: CORS errors from frontend
**Solution**: Ensure deployment is set to "Anyone" access and functions return proper ContentService output

### Issue: Preflight OPTIONS request fails
**Solution**: Implement proper `doOptions` function that returns ContentService output

### Issue: JSON parsing errors
**Solution**: Always use `JSON.stringify()` when returning data and `JSON.parse()` when reading request data

## Complete Example

```javascript
// Main entry point for POST requests
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
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// Internal function
function addExpense(data) {
  try {
    // Business logic here
    return { success: true, message: 'Expense added' };
  } catch (error) {
    return { error: error.toString() };
  }
}
```

This pattern ensures that Google Apps Script automatically adds the necessary CORS headers to all responses. 
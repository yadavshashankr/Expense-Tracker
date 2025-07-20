# Migration to Google Apps Script

This document explains the migration from direct Google Sheets API to Google Apps Script backend for the Expense Tracker application.

## Why Google Apps Script?

### Problems with Direct API Approach

1. **Cross-User Permission Issues**: 
   - Cannot create sheets in other users' Google Drive accounts
   - Requires complex OAuth2 flows for each user
   - Access token limitations

2. **Complex Authentication**:
   - Need to manage access tokens
   - Token refresh handling
   - CORS issues with client-side API calls

3. **Security Concerns**:
   - API keys exposed in frontend
   - Sensitive credentials in client code
   - Limited access control

### Benefits of Google Apps Script

1. **✅ Cross-User Functionality**:
   - Automatically creates sheets for both users
   - Mirrors transactions with proper balance calculation
   - No permission issues between users

2. **✅ Simplified Authentication**:
   - No need for complex OAuth2 flows
   - No access token management
   - Works with any Google account

3. **✅ Better Performance**:
   - Server-side processing
   - Reduced API calls
   - Automatic balance calculations

4. **✅ Enhanced Security**:
   - Backend logic runs on Google's servers
   - No sensitive credentials in frontend
   - Proper access controls

5. **✅ Easier Maintenance**:
   - Single backend for all operations
   - Centralized business logic
   - Easier to add new features

## Migration Summary

### What Changed

| Component | Before | After |
|-----------|--------|-------|
| **Backend** | Direct Google Sheets API calls | Google Apps Script Web App |
| **Authentication** | OAuth2 access tokens | Google account login |
| **Cross-User** | ❌ Not possible | ✅ Automatic sheet creation |
| **Balance Calculation** | Client-side | Server-side |
| **Error Handling** | API-specific errors | Centralized error handling |

### Files Modified

1. **`src/services/appsScript.js`** (NEW)
   - Replaces `src/services/sheets.js`
   - Handles all communication with Apps Script backend

2. **`src/App.jsx`** (MODIFIED)
   - Updated to use Apps Script service
   - Removed OAuth2 token dependencies
   - Simplified authentication checks

3. **`google-apps-script/Code.gs`** (NEW)
   - Complete backend implementation
   - Handles all CRUD operations
   - Manages cross-user functionality

### Files Removed/Deprecated

- `src/services/sheets.js` - No longer needed
- OAuth2 authentication complexity
- Access token management

## Key Features Implemented

### 1. Automatic Cross-User Sheet Creation

```javascript
// When user A adds a transaction with user B
// Apps Script automatically:
// 1. Creates sheet for user A (if not exists)
// 2. Creates sheet for user B (if not exists)
// 3. Adds transaction to user A's sheet
// 4. Adds mirrored transaction to user B's sheet
```

### 2. Proper Balance Calculation

```javascript
// Server-side balance calculation
// Handles complex scenarios:
// - Multiple transactions between users
// - Reversed transaction types
// - Running balance updates
```

### 3. Centralized Error Handling

```javascript
// All errors handled in one place
// Consistent error messages
// Better debugging capabilities
```

## Deployment Process

### 1. Deploy Apps Script Backend
- Copy `google-apps-script/Code.gs` to Google Apps Script
- Enable required services (Sheets API, Drive API)
- Deploy as Web App
- Get the Web App URL

### 2. Update Frontend Configuration
- Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` in `src/services/appsScript.js`
- Test the connection

### 3. Test Functionality
- Basic CRUD operations
- Cross-user transactions
- Balance calculations

## Technical Architecture

### Frontend (React)
```
App.jsx
├── LoginButton.jsx (Google OAuth2 for user identification)
├── ExpenseForm.jsx (Transaction input)
├── ExpenseTable.jsx (Display transactions)
└── appsScript.js (API communication)
```

### Backend (Google Apps Script)
```
Code.gs
├── doPost() (Main entry point)
├── addExpense() (Add + mirror transactions)
├── getExpenses() (Fetch user transactions)
├── updateExpense() (Update transaction)
├── deleteExpense() (Delete transaction)
└── ensureUserSheet() (Create user sheets)
```

### Data Flow
```
User Action → React Frontend → Apps Script Backend → Google Sheets
     ↑                                                      ↓
     └────────────── Response ← JSON ← Backend ←────────────┘
```

## Security Considerations

### ✅ What's Secure
- Backend logic runs on Google's servers
- No API keys in frontend code
- Proper access controls via Apps Script
- User authentication via Google OAuth2

### ⚠️ What to Consider
- Apps Script Web App URL is public
- Can restrict access to specific domains/users
- Consider implementing additional authentication if needed

## Performance Improvements

### Before (Direct API)
- Multiple API calls per operation
- Client-side balance calculations
- Token refresh overhead
- CORS issues

### After (Apps Script)
- Single API call per operation
- Server-side balance calculations
- No token management
- No CORS issues

## Future Enhancements

### Easy to Add
1. **Email Notifications**: Send emails when transactions are added
2. **SMS Notifications**: Integrate with SMS services
3. **Reports**: Generate PDF reports
4. **Categories**: Add transaction categories
5. **Recurring Transactions**: Schedule regular transactions

### Advanced Features
1. **Multi-Currency Support**: Handle different currencies
2. **Group Expenses**: Split expenses among multiple users
3. **Budget Tracking**: Set and track budgets
4. **Analytics**: Advanced reporting and analytics

## Troubleshooting

### Common Issues

1. **Apps Script URL Not Working**
   - Check deployment settings
   - Ensure "Anyone" access is enabled
   - Verify the URL is correct

2. **Cross-User Transactions Not Working**
   - Check Apps Script logs
   - Verify Google Drive API is enabled
   - Ensure proper permissions

3. **Balance Calculation Errors**
   - Check transaction data format
   - Verify balance calculation logic
   - Review Apps Script logs

### Debugging Tips

1. **Check Apps Script Logs**
   - Go to Apps Script editor
   - Click "Executions"
   - View recent executions

2. **Test Individual Functions**
   - Use Apps Script editor to test functions
   - Add console.log statements
   - Check return values

3. **Browser Console**
   - Check network requests
   - Look for JavaScript errors
   - Verify API responses

## Conclusion

The migration to Google Apps Script provides a robust, scalable, and secure solution for cross-user expense tracking. The architecture eliminates the complex permission issues while providing better performance and easier maintenance.

### Key Benefits Achieved
- ✅ **Cross-User Functionality**: Works seamlessly between users
- ✅ **Simplified Architecture**: No complex OAuth2 flows
- ✅ **Better Performance**: Server-side processing
- ✅ **Enhanced Security**: Backend on Google's servers
- ✅ **Easier Maintenance**: Centralized business logic

### Next Steps
1. Deploy the Apps Script backend
2. Update the frontend configuration
3. Test all functionality
4. Customize as needed
5. Add additional features

This migration transforms the expense tracker from a single-user application to a powerful multi-user platform with automatic synchronization and proper balance tracking. 
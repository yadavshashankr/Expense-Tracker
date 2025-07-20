# Google Apps Script Deployment Guide

This guide will help you deploy the Google Apps Script backend and configure your frontend to use it.

## Prerequisites

- Google account with access to Google Apps Script
- Your expense tracker React application

## Step 1: Deploy Google Apps Script Backend

### 1.1 Create New Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/)
2. Click **"New Project"**
3. Rename the project to "Expense Tracker Backend"

### 1.2 Copy the Apps Script Code

1. Delete the default `Code.gs` content
2. Copy the entire content from `google-apps-script/Code.gs` in this project
3. Paste it into the Apps Script editor

### 1.3 Enable Required Google Services

1. In the Apps Script editor, click on **"Services"** in the left sidebar
2. Add the following services:
   - **Google Sheets API**
   - **Google Drive API**

### 1.4 Deploy as Web App

1. Click **"Deploy"** > **"New deployment"**
2. Choose **"Web app"** as the type
3. Configure the deployment:
   - **Execute as**: "Me" (your Google account)
   - **Who has access**: "Anyone" (for now, you can restrict this later)
4. Click **"Deploy"**
5. **Authorize** the app when prompted
6. Copy the **Web app URL** - you'll need this for the frontend

### 1.5 Test the Backend

1. Open the Web app URL in a browser
2. You should see a JSON response like:
   ```json
   {
     "status": "Expense Tracker Apps Script Backend is running",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

### 1.6 CORS Configuration

Google Apps Script automatically handles CORS when deployed as a web app. The backend will work with:
- `https://yadavshashankr.github.io` (your GitHub Pages domain)
- `http://localhost:5173` (local development)
- `http://localhost:3000` (alternative local development)
- Any other domain that makes requests to the web app

No additional CORS configuration is needed - Google Apps Script handles this automatically.

## Step 2: Configure Frontend

### 2.1 Update Apps Script URL

1. Open `src/services/appsScript.js`
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` with your actual Web app URL from Step 1.4

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

### 2.2 Test the Connection

1. Start your React development server: `npm run dev`
2. Open the browser console
3. The app should now use the Apps Script backend instead of direct Google Sheets API

## Step 3: Security Configuration (Optional)

### 3.1 Restrict Access

If you want to restrict access to specific users:

1. Go back to your Apps Script project
2. Click **"Deploy"** > **"Manage deployments"**
3. Click the edit icon (pencil) next to your deployment
4. Change **"Who has access"** to:
   - **"Anyone with Google account"** - for users with Google accounts
   - **"Anyone"** - for public access (less secure)

### 3.2 Domain Restrictions

For additional security, you can restrict access to specific domains:

1. In Apps Script, go to **"Project Settings"**
2. Under **"Script Properties"**, add:
   - Key: `ALLOWED_DOMAINS`
   - Value: `yourdomain.com,anotherdomain.com`

## Step 4: Testing the Complete System

### 4.1 Test Basic Operations

1. **Sign In**: Use your Google account to sign in
2. **Add Transaction**: Create a new expense transaction
3. **View Transactions**: Verify transactions appear in the table
4. **Update Transaction**: Edit an existing transaction
5. **Delete Transaction**: Remove a transaction

### 4.2 Test Cross-User Functionality

1. **Add Transaction with Recipient**: 
   - Create a transaction with a different email address
   - Verify the transaction appears in both users' sheets
2. **Check Recipient Sheet**: 
   - The recipient's sheet should be created automatically
   - The transaction should be mirrored with reversed type

### 4.3 Verify Sheet Creation

1. Check your Google Drive
2. Look for a folder named "ExpenseTracker"
3. Inside should be sheets named `{email}-transactions`
4. Each sheet should have proper headers and formatting

## Step 5: Troubleshooting

### Common Issues

#### 1. CORS Errors
- **Problem**: Browser blocks requests to Apps Script
- **Solution**: 
  - Google Apps Script automatically handles CORS for web apps
  - Ensure your deployment is set to "Anyone" access
  - Check that the web app URL is correct
  - Verify the deployment is active and accessible

#### 2. Authorization Errors
- **Problem**: "You do not have permission to access this script"
- **Solution**: Check deployment settings and ensure proper authorization

#### 3. Sheet Creation Fails
- **Problem**: Cannot create sheets in Google Drive
- **Solution**: Ensure Google Drive API is enabled in Apps Script services

#### 4. Cross-User Transactions Not Working
- **Problem**: Recipient sheets not being created/updated
- **Solution**: Check Apps Script logs for errors and ensure proper permissions

### Debugging

1. **Check Apps Script Logs**:
   - In Apps Script editor, click **"Executions"**
   - View recent executions and logs

2. **Check Browser Console**:
   - Open browser developer tools
   - Look for network requests and errors

3. **Test Individual Functions**:
   - Use the Apps Script editor to test functions manually
   - Add console.log statements for debugging

## Step 6: Production Deployment

### 6.1 Frontend Deployment

Deploy your React app to your preferred hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### 6.2 Update Production URL

1. Update the `APPS_SCRIPT_URL` in your production build
2. Or use environment variables:

```javascript
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || 'YOUR_URL';
```

### 6.3 Environment Variables (Optional)

Create a `.env` file:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Benefits of This Architecture

### ✅ **Cross-User Functionality**
- Automatically creates sheets for both users
- Mirrors transactions with proper balance calculation
- No permission issues between users

### ✅ **Simplified Authentication**
- No need for complex OAuth2 flows
- No access token management
- Works with any Google account

### ✅ **Better Performance**
- Server-side processing
- Reduced API calls
- Automatic balance calculations

### ✅ **Enhanced Security**
- Backend logic runs on Google's servers
- No sensitive credentials in frontend
- Proper access controls

### ✅ **Easier Maintenance**
- Single backend for all operations
- Centralized business logic
- Easier to add new features

## Next Steps

1. **Customize the UI**: Modify the frontend to better suit your needs
2. **Add Features**: Implement additional functionality like reports, categories, etc.
3. **Optimize Performance**: Add caching, pagination, etc.
4. **Enhance Security**: Implement user authentication and authorization
5. **Add Notifications**: Implement email/SMS notifications for transactions

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review Apps Script logs for errors
3. Verify all deployment steps were completed correctly
4. Test with a simple transaction first

---

**Note**: This implementation provides a robust foundation for cross-user expense tracking with automatic sheet synchronization and proper balance calculations. 
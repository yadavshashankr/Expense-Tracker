// Google Apps Script Backend for Expense Tracker
// This script handles all backend operations for the expense tracker application

// Configuration
const APP_NAME = 'ExpenseTracker';
const HEADERS = [['ID', 'Timestamp', 'User Email', 'Name', 'Type', 'Amount', 'Description', 'Balance', 'Country Code', 'Phone']];

// Simple in-memory cache for sheet IDs (resets when script restarts)
const SHEET_ID_CACHE = {};

// CORS Configuration
const ALLOWED_ORIGINS = [
  'https://yadavshashankr.github.io',
  'http://localhost:5173', // For local development
  'http://localhost:3000'  // Alternative local development port
];

/**
 * Set CORS headers for the response
 */
function setCorsHeaders(response) {
  // Google Apps Script automatically handles CORS for web app deployments
  // We just need to ensure proper MIME type and content
  return response;
}

/**
 * Handle OPTIONS requests (CORS preflight)
 */
function doOptions(e) {
  // Return a proper response for preflight requests with CORS headers
  // This should automatically add CORS headers for preflight requests
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Main entry point for POST requests from the frontend
 */
function doPost(e) {
  try {
    console.log('POST request received:', e);
    console.log('POST parameters:', e.parameter);
    console.log('POST data:', e.postData);
    console.log('POST data type:', e.postData ? e.postData.type : 'none');
    console.log('POST data contents:', e.postData ? e.postData.contents : 'none');
    
    let action, data;
    
    // Handle form data (from FormData) - check both parameter and postData
    if (e.parameter && e.parameter.action) {
      console.log('Processing FormData from parameters');
      action = e.parameter.action;
      data = {};
      
      // Parse all parameters
      Object.keys(e.parameter).forEach(key => {
        if (key !== 'action') {
          try {
            // Try to parse as JSON first
            data[key] = JSON.parse(e.parameter[key]);
            console.log(`Parsed ${key} as JSON:`, data[key]);
          } catch (parseError) {
            // If not JSON, use as string
            data[key] = e.parameter[key];
            console.log(`Used ${key} as string:`, data[key]);
          }
        }
      });
    }
    // Handle multipart form data
    else if (e.postData && e.postData.type && e.postData.type.includes('multipart')) {
      console.log('Processing multipart form data');
      // For multipart form data, we need to parse it differently
      const formData = e.postData.contents;
      console.log('Form data contents:', formData);
      
      // Extract action from form data
      const actionMatch = formData.match(/name="action"\s*\r?\n\r?\n([^\r\n]+)/);
      if (actionMatch) {
        action = actionMatch[1];
        console.log('Extracted action from form data:', action);
        
        data = {};
        // Extract other fields
        const userEmailMatch = formData.match(/name="userEmail"\s*\r?\n\r?\n([^\r\n]+)/);
        if (userEmailMatch) data.userEmail = userEmailMatch[1];
        
        const expenseMatch = formData.match(/name="expense"\s*\r?\n\r?\n([^\r\n]+)/);
        if (expenseMatch) {
          try {
            data.expense = JSON.parse(expenseMatch[1]);
          } catch (e) {
            data.expense = expenseMatch[1];
          }
        }
        
        const recipientEmailMatch = formData.match(/name="recipientEmail"\s*\r?\n\r?\n([^\r\n]+)/);
        if (recipientEmailMatch) data.recipientEmail = recipientEmailMatch[1];
      }
    }
    // Handle JSON data (fallback)
    else if (e.postData && e.postData.contents) {
      console.log('Processing JSON data');
      const jsonData = JSON.parse(e.postData.contents);
      action = jsonData.action;
      data = jsonData;
    }
    else {
      console.error('Invalid request: missing action or data');
      console.error('Available data:', {
        hasParameter: !!e.parameter,
        parameterKeys: e.parameter ? Object.keys(e.parameter) : [],
        hasPostData: !!e.postData,
        postDataType: e.postData ? e.postData.type : 'none'
      });
      return ContentService.createTextOutput(JSON.stringify({ 
        error: 'Invalid request: missing action or data',
        message: 'This endpoint expects a POST request with form data or JSON',
        debug: {
          hasParameter: !!e.parameter,
          parameterKeys: e.parameter ? Object.keys(e.parameter) : [],
          hasPostData: !!e.postData,
          postDataType: e.postData ? e.postData.type : 'none'
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log(`Received action: ${action}`, data);
    
    let result;
    switch(action) {
      case 'addExpense':
        result = addExpense(data);
        break;
      
      case 'getExpenses':
        result = getExpenses(data);
        break;
      
      case 'updateExpense':
        result = updateExpense(data);
        break;
      
      case 'deleteExpense':
        result = deleteExpense(data);
        break;
      
      case 'ensureUserSheet':
        result = ensureUserSheet(data);
        break;
      
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing and read-only operations)
 */
function doGet(e) {
  try {
    console.log('GET request received:', e);
    console.log('GET parameters:', e.parameter);
    
    // If no parameters, return status info
    if (!e || !e.parameter || !e.parameter.action) {
      console.log('No action parameter, returning status info');
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'Expense Tracker Apps Script Backend is running',
        timestamp: new Date().toISOString(),
        message: 'Use POST requests with JSON data for actual operations'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    const action = e.parameter.action;
    console.log(`GET request with action: ${action}`, e.parameter);
    
    let result;
    switch(action) {
      case 'getExpenses':
        console.log('Processing getExpenses with userEmail:', e.parameter.userEmail);
        result = getExpenses({ userEmail: e.parameter.userEmail });
        break;
      
      case 'ensureUserSheet':
        console.log('Processing ensureUserSheet with userEmail:', e.parameter.userEmail);
        result = ensureUserSheet({ userEmail: e.parameter.userEmail });
        break;
      
      default:
        console.log('Invalid action for GET request:', action);
        result = { error: 'Invalid action for GET request' };
    }
    
    console.log('GET result:', result);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function that can be run manually in Apps Script editor
 */
function testBackend() {
  console.log('Testing backend functions...');
  
  try {
    // Test ensureUserSheet
    const testEmail = 'test@example.com';
    console.log(`Testing with email: ${testEmail}`);
    
    const result = ensureUserSheetInternal(testEmail);
    console.log('ensureUserSheetInternal result:', result);
    
    if (result) {
      console.log('✅ Test passed: Sheet created/found successfully');
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Backend test completed successfully',
        testEmail: testEmail,
        sheetId: result
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      console.log('❌ Test failed: Sheet creation returned null');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet creation returned null',
        testEmail: testEmail
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Test failed:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Add expense to user's sheet
 */
function addExpense(data) {
  try {
    const { userEmail, expense } = data;
    
    if (!userEmail || !expense) {
      return { error: 'Missing required data: userEmail and expense' };
    }
    
    // Ensure user's sheet exists
    const userSheetId = ensureUserSheetInternal(userEmail);
    if (!userSheetId) {
      return { error: 'Failed to create user sheet' };
    }
    
    // Add transaction to current user's sheet
    const userSheet = SpreadsheetApp.openById(userSheetId);
    const userSheetData = userSheet.getActiveSheet();
    
    // Calculate balance for current user's sheet
    const existingTransactions = getAllTransactionsFromSheet(userSheetData);
    const balance = calculateBalance(existingTransactions, userEmail, expense.userEmail);
    
    // Prepare row data for current user
    const rowData = [
      expense.id,
      expense.timestamp,
      expense.userEmail,
      expense.name,
      expense.type,
      expense.amount,
      expense.description || '',
      balance,
      String(expense.countryCode || '+91').startsWith('+') ? String(expense.countryCode || '+91') : '+' + String(expense.countryCode || '91'),
      expense.phone || ''
    ];
    
    // Add to current user's sheet
    userSheetData.appendRow(rowData);
    
    // Cross-user transaction mirroring
    if (expense.userEmail && expense.userEmail !== userEmail) {
      console.log(`Starting cross-user mirroring: ${userEmail} -> ${expense.userEmail}`);
      
      // Ensure the other user's sheet exists
      const otherUserSheetId = ensureUserSheetInternal(expense.userEmail);
      if (otherUserSheetId) {
        console.log(`Successfully got sheet for ${expense.userEmail}: ${otherUserSheetId}`);
        
        try {
          const otherUserSheet = SpreadsheetApp.openById(otherUserSheetId);
          const otherUserSheetData = otherUserSheet.getActiveSheet();
          
          // Calculate balance for the other user's sheet
          const otherUserTransactions = getAllTransactionsFromSheet(otherUserSheetData);
          const otherUserBalance = calculateBalance(otherUserTransactions, expense.userEmail, userEmail);
          
          // Prepare mirrored row data (with reversed transaction type)
          const mirroredRowData = [
            expense.id,
            expense.timestamp,
            userEmail, // Current user becomes the other user in mirrored transaction
            expense.name, // Set to sender's name
            expense.type === 'credit' ? 'debit' : 'credit', // Reverse the transaction type
            expense.amount,
            expense.description || '',
            otherUserBalance,
            String(expense.countryCode || '+91').startsWith('+') ? String(expense.countryCode || '+91') : '+' + String(expense.countryCode || '91'),
            expense.phone || ''
          ];
          
          console.log(`Adding mirrored transaction to ${expense.userEmail}'s sheet:`, mirroredRowData);
          
          // Add mirrored transaction to the other user's sheet
          otherUserSheetData.appendRow(mirroredRowData);
          
          console.log(`Successfully added mirrored transaction to ${expense.userEmail}'s sheet`);
        } catch (mirrorError) {
          console.error(`Error adding mirrored transaction to ${expense.userEmail}'s sheet:`, mirrorError);
          // Don't fail the entire operation if mirroring fails
        }
      } else {
        console.error(`Failed to create/get sheet for ${expense.userEmail}`);
      }
    } else {
      console.log(`No cross-user mirroring needed: expense.userEmail=${expense.userEmail}, userEmail=${userEmail}`);
    }
    
    return { 
      success: true, 
      message: 'Expense added successfully',
      userSheetId: userSheetId
    };
    
  } catch (error) {
    console.error('Error in addExpense:', error);
    return { error: error.toString() };
  }
}

/**
 * Get all expenses for a user
 */
function getExpenses(data) {
  try {
    const { userEmail } = data;
    
    if (!userEmail) {
      return { error: 'Missing userEmail' };
    }
    
    console.log(`Getting expenses for user: ${userEmail}`);
    
    const sheetId = ensureUserSheetInternal(userEmail);
    if (!sheetId) {
      console.error(`Failed to create/get sheet for ${userEmail}`);
      return { error: 'Failed to create user sheet' };
    }
    
    console.log(`Using sheet ID for ${userEmail}: ${sheetId}`);
    
    const sheet = SpreadsheetApp.openById(sheetId);
    const sheetData = sheet.getActiveSheet();
    
    const transactions = getAllTransactionsFromSheet(sheetData);
    
    console.log(`Retrieved ${transactions.length} transactions for ${userEmail}`);
    if (transactions.length > 0) {
      console.log('Sample transaction:', transactions[0]);
    }
    
    return {
      success: true,
      expenses: transactions,
      sheetId: sheetId
    };
    
  } catch (error) {
    console.error('Error in getExpenses:', error);
    return { error: error.toString() };
  }
}

/**
 * Update an existing expense
 */
function updateExpense(data) {
  try {
    const { userEmail, rowIndex, expense } = data;
    
    if (!userEmail || rowIndex === undefined || !expense) {
      return { error: 'Missing required data: userEmail, rowIndex, and expense' };
    }
    
    const sheetId = ensureUserSheetInternal(userEmail);
    if (!sheetId) {
      return { error: 'Failed to create user sheet' };
    }
    
    const sheet = SpreadsheetApp.openById(sheetId);
    const sheetData = sheet.getActiveSheet();
    
    // Update the specific row (rowIndex + 2 because of headers and 0-based index)
    const rowNumber = rowIndex + 2;
    
    // Calculate new balance
    const allTransactions = getAllTransactionsFromSheet(sheetData);
    allTransactions[rowIndex] = expense;
    const balance = calculateBalance(allTransactions, userEmail, expense.userEmail);
    
    // Prepare updated row data
    const rowData = [
      expense.id,
      expense.timestamp,
      expense.userEmail,
      expense.name,
      expense.type,
      expense.amount,
      expense.description || '',
      balance,
      String(expense.countryCode || '+91').startsWith('+') ? String(expense.countryCode || '+91') : '+' + String(expense.countryCode || '91'),
      expense.phone || ''
    ];
    
    // Update the row
    const range = sheetData.getRange(rowNumber, 1, 1, rowData.length);
    range.setValues([rowData]);
    
    // Cross-user transaction mirroring for updates
    if (expense.userEmail && expense.userEmail !== userEmail) {
      // Ensure the other user's sheet exists
      const otherUserSheetId = ensureUserSheetInternal(expense.userEmail);
      if (otherUserSheetId) {
        const otherUserSheet = SpreadsheetApp.openById(otherUserSheetId);
        const otherUserSheetData = otherUserSheet.getActiveSheet();
        
        // Find the mirrored transaction in the other user's sheet
        const otherUserTransactions = getAllTransactionsFromSheet(otherUserSheetData);
        const mirroredTransactionIndex = otherUserTransactions.findIndex(t => t.id === expense.id);
        
        if (mirroredTransactionIndex !== -1) {
          // Calculate new balance for the other user's sheet
          const otherUserAllTransactions = getAllTransactionsFromSheet(otherUserSheetData);
          const mirroredExpense = {
            ...expense,
            userEmail: userEmail, // Swap the user emails for mirroring
            type: expense.type === 'credit' ? 'debit' : 'credit' // Reverse the transaction type
          };
          otherUserAllTransactions[mirroredTransactionIndex] = mirroredExpense;
          const otherUserBalance = calculateBalance(otherUserAllTransactions, expense.userEmail, userEmail);
          
          // Prepare mirrored updated row data
          const mirroredRowData = [
            expense.id,
            expense.timestamp,
            userEmail, // Current user becomes the other user in mirrored transaction
            expense.name,
            expense.type === 'credit' ? 'debit' : 'credit', // Reverse the transaction type
            expense.amount,
            expense.description || '',
            otherUserBalance,
            String(expense.countryCode || '+91').startsWith('+') ? String(expense.countryCode || '+91') : '+' + String(expense.countryCode || '91'),
            expense.phone || ''
          ];
          
          // Update the mirrored transaction in the other user's sheet
          const mirroredRowNumber = mirroredTransactionIndex + 2;
          const mirroredRange = otherUserSheetData.getRange(mirroredRowNumber, 1, 1, mirroredRowData.length);
          mirroredRange.setValues([mirroredRowData]);
        }
      }
    }
    
    return { 
      success: true, 
      message: 'Expense updated successfully' 
    };
    
  } catch (error) {
    console.error('Error in updateExpense:', error);
    return { error: error.toString() };
  }
}

/**
 * Delete an expense
 */
function deleteExpense(data) {
  try {
    const { userEmail, rowIndex } = data;
    
    if (!userEmail || rowIndex === undefined) {
      return { error: 'Missing required data: userEmail and rowIndex' };
    }
    
    const sheetId = ensureUserSheetInternal(userEmail);
    if (!sheetId) {
      return { error: 'Failed to create user sheet' };
    }
    
    const sheet = SpreadsheetApp.openById(sheetId);
    const sheetData = sheet.getActiveSheet();
    
    // Get the transaction details before deleting for cross-user mirroring
    const transactions = getAllTransactionsFromSheet(sheetData);
    const transactionToDelete = transactions[rowIndex];
    
    // Delete the specific row (rowIndex + 2 because of headers and 0-based index)
    const rowNumber = rowIndex + 2;
    sheetData.deleteRow(rowNumber);
    
    // Cross-user transaction mirroring for deletion
    if (transactionToDelete && transactionToDelete.userEmail && transactionToDelete.userEmail !== userEmail) {
      // Ensure the other user's sheet exists
      const otherUserSheetId = ensureUserSheetInternal(transactionToDelete.userEmail);
      if (otherUserSheetId) {
        const otherUserSheet = SpreadsheetApp.openById(otherUserSheetId);
        const otherUserSheetData = otherUserSheet.getActiveSheet();
        
        // Find the mirrored transaction in the other user's sheet
        const otherUserTransactions = getAllTransactionsFromSheet(otherUserSheetData);
        const mirroredTransactionIndex = otherUserTransactions.findIndex(t => t.id === transactionToDelete.id);
        
        if (mirroredTransactionIndex !== -1) {
          // Delete the mirrored transaction in the other user's sheet
          const mirroredRowNumber = mirroredTransactionIndex + 2;
          otherUserSheetData.deleteRow(mirroredRowNumber);
        }
      }
    }
    
    return { 
      success: true, 
      message: 'Expense deleted successfully' 
    };
    
  } catch (error) {
    console.error('Error in deleteExpense:', error);
    return { error: error.toString() };
  }
}

/**
 * Ensure user sheet exists and return sheet ID
 */
function ensureUserSheet(data) {
  try {
    const { userEmail } = data;
    
    if (!userEmail) {
      return { error: 'Missing userEmail' };
    }
    
    const sheetId = ensureUserSheetInternal(userEmail);
    
    if (sheetId) {
      return { 
        success: true, 
        sheetId: sheetId 
      };
    } else {
      return { error: 'Failed to create user sheet' };
    }
    
  } catch (error) {
    console.error('Error in ensureUserSheet:', error);
    return { error: error.toString() };
  }
}

/**
 * Internal function to ensure user sheet exists using direct access
 * Much faster than searching through folders and files
 */
function ensureUserSheetInternal(userEmail) {
  try {
    console.log(`Ensuring sheet exists for user: ${userEmail}`);
    
    // Check cache first (fastest)
    if (SHEET_ID_CACHE[userEmail]) {
      console.log(`Using cached sheet ID for ${userEmail}: ${SHEET_ID_CACHE[userEmail]}`);
      return SHEET_ID_CACHE[userEmail];
    }
    
    // Use predictable naming convention: {userEmail}-transactions
    const sheetName = `${userEmail}-transactions`;
    
    // First, try to open the sheet directly using the naming convention
    try {
      // Try to find the sheet by name directly
      const sheets = DriveApp.getFilesByName(sheetName);
      if (sheets.hasNext()) {
        const sheet = sheets.next();
        const sheetId = sheet.getId();
        console.log(`Found existing sheet: ${sheet.getName()} with ID: ${sheetId}`);
        
        // Cache the sheet ID for future use
        SHEET_ID_CACHE[userEmail] = sheetId;
        return sheetId;
      }
    } catch (directAccessError) {
      console.log(`Direct access failed, will create new sheet: ${directAccessError}`);
    }
    
    // If sheet doesn't exist, create it with proper naming
    console.log(`Creating new sheet: ${sheetName}`);
    const sheet = SpreadsheetApp.create(sheetName);
    const sheetId = sheet.getId();
    
    // Add headers immediately
    const sheetData = sheet.getActiveSheet();
    sheetData.getRange(1, 1, 1, HEADERS[0].length).setValues(HEADERS);
    
    // Set text wrapping for better readability
    sheetData.getRange(1, 1, 1000, HEADERS[0].length).setWrap(true);
    
    // Try to organize in folder if possible (but don't fail if it doesn't work)
    try {
      // Create or find the main folder
      let folder;
      const folders = DriveApp.getFoldersByName(APP_NAME);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(APP_NAME);
      }
      
      // Move sheet to folder
      const sheetFile = DriveApp.getFileById(sheetId);
      folder.addFile(sheetFile);
      DriveApp.getRootFolder().removeFile(sheetFile);
      console.log(`Organized sheet in folder: ${folder.getName()}`);
    } catch (folderError) {
      console.log(`Could not organize in folder, keeping in root: ${folderError}`);
      // This is not critical - sheet will work fine in root
    }
    
    // Cache the new sheet ID
    SHEET_ID_CACHE[userEmail] = sheetId;
    
    console.log(`Successfully created sheet: ${sheetName} with ID: ${sheetId}`);
    return sheetId;
    
  } catch (error) {
    console.error('Error in ensureUserSheetInternal:', error);
    console.error('Error details:', error.toString());
    return null;
  }
}

/**
 * Clear sheet ID cache for a specific user (useful when sheet is deleted or moved)
 */
function clearSheetCache(userEmail) {
  if (SHEET_ID_CACHE[userEmail]) {
    delete SHEET_ID_CACHE[userEmail];
    console.log(`Cleared sheet cache for ${userEmail}`);
  }
}

/**
 * Get cache statistics (useful for debugging)
 */
function getSheetCacheStats() {
  return {
    cacheSize: Object.keys(SHEET_ID_CACHE).length,
    cachedUsers: Object.keys(SHEET_ID_CACHE),
    cacheEntries: SHEET_ID_CACHE
  };
}

/**
 * Get all transactions from a sheet
 */
function getAllTransactionsFromSheet(sheetData) {
  try {
    const data = sheetData.getDataRange().getValues();
    
    // Skip header row
    if (data.length <= 1) {
      return [];
    }
    
    const transactions = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // Check if ID exists
        transactions.push({
          id: row[0],
          timestamp: row[1],
          userEmail: row[2],
          name: row[3],
          type: row[4],
          amount: row[5],
          description: row[6],
          balance: parseFloat(row[7] || 0),
          countryCode: String(row[8] || '+91').startsWith('+') ? String(row[8] || '+91') : '+' + String(row[8] || '91'),
          phone: row[9] || ''
        });
      }
    }
    
    return transactions;
    
  } catch (error) {
    console.error('Error in getAllTransactionsFromSheet:', error);
    return [];
  }
}

/**
 * Calculate balance for transactions
 */
function calculateBalance(transactions, currentUserEmail, targetEmail) {
  if (transactions.length === 0) return 0;

  // For the first transaction, handle it directly
  if (transactions.length === 1) {
    const firstTransaction = transactions[0];
    const amount = parseFloat(firstTransaction.amount);
    
    // If it's my transaction
    if (firstTransaction.userEmail === currentUserEmail) {
      // If I owe them (debit), it should be negative
      if (firstTransaction.type === 'debit') return -amount;
      // If they owe me (credit), it should be positive
      if (firstTransaction.type === 'credit') return amount;
    } else {
      // If they owe me (credit), it should be positive
      if (firstTransaction.type === 'credit') return amount;
      // If I owe them (debit), it should be negative
      if (firstTransaction.type === 'debit') return -amount;
    }
    return 0;
  }

  // For multiple transactions, calculate total balance
  return transactions.reduce((balance, transaction) => {
    if (transaction.userEmail !== targetEmail && transaction.userEmail !== currentUserEmail) {
      return balance;
    }

    const amount = parseFloat(transaction.amount);
    
    // From logged-in user's perspective:
    if (transaction.userEmail === currentUserEmail) {
      // When I owe them (debit), my balance decreases
      if (transaction.type === 'debit') return balance - amount;
      // When they owe me (credit), my balance increases
      if (transaction.type === 'credit') return balance + amount;
    } else {
      // When they owe me (credit), my balance increases
      if (transaction.type === 'credit') return balance + amount;
      // When I owe them (debit), my balance decreases
      if (transaction.type === 'debit') return balance - amount;
    }
    return balance;
  }, 0);
} 
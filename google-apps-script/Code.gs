// Google Apps Script Backend for Expense Tracker
// This script handles all backend operations for the expense tracker application

// Configuration
const APP_NAME = 'ExpenseTracker';
const HEADERS = [['ID', 'Timestamp', 'User Email', 'Name', 'Type', 'Amount', 'Description', 'Balance', 'Country Code', 'Phone']];

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
  // Return a simple response for preflight requests
  // Google Apps Script will automatically add CORS headers
  return ContentService.createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Main entry point for POST requests from the frontend
 */
function doPost(e) {
  try {
    // Check if event object exists and has postData
    if (!e || !e.postData || !e.postData.contents) {
      console.error('Invalid request: missing postData');
      return ContentService.createTextOutput(JSON.stringify({ 
        error: 'Invalid request: missing postData',
        message: 'This endpoint expects a POST request with JSON data'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
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
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'Expense Tracker Apps Script Backend is running',
    timestamp: new Date().toISOString(),
    message: 'Use POST requests with JSON data for actual operations'
  }))
  .setMimeType(ContentService.MimeType.JSON);
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
      return {
        success: true,
        message: 'Backend test completed successfully',
        testEmail: testEmail,
        sheetId: result
      };
    } else {
      console.log('❌ Test failed: Sheet creation returned null');
      return {
        success: false,
        error: 'Sheet creation returned null',
        testEmail: testEmail
      };
    }
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Add expense to user's sheet and create mirrored transaction for recipient
 */
function addExpense(data) {
  try {
    const { userEmail, expense, recipientEmail } = data;
    
    if (!userEmail || !expense) {
      return { error: 'Missing required data: userEmail and expense' };
    }
    
    // Ensure user's sheet exists
    const userSheetId = ensureUserSheetInternal(userEmail);
    if (!userSheetId) {
      return { error: 'Failed to create user sheet' };
    }
    
    // Add transaction to user's sheet
    const userSheet = SpreadsheetApp.openById(userSheetId);
    const userSheetData = userSheet.getActiveSheet();
    
    // Calculate balance for user's sheet
    const existingTransactions = getAllTransactionsFromSheet(userSheetData);
    const balance = calculateBalance(existingTransactions, userEmail, expense.userEmail);
    
    // Prepare row data
    const rowData = [
      expense.id,
      expense.timestamp,
      expense.userEmail,
      expense.name,
      expense.type,
      expense.amount,
      expense.description || '',
      balance,
      expense.countryCode || '+91',
      expense.phone || ''
    ];
    
    // Add to user's sheet
    userSheetData.appendRow(rowData);
    
    // If there's a recipient and it's not the same user, create mirrored transaction
    if (recipientEmail && recipientEmail !== userEmail) {
      const recipientSheetId = ensureUserSheetInternal(recipientEmail);
      if (recipientSheetId) {
        const recipientSheet = SpreadsheetApp.openById(recipientSheetId);
        const recipientSheetData = recipientSheet.getActiveSheet();
        
        // Create mirrored transaction
        const mirroredExpense = {
          ...expense,
          userEmail: userEmail, // The logged-in user's email
          name: userEmail, // Use email as name for simplicity
          type: expense.type === 'debit' ? 'credit' : 'debit', // Reverse the type
          id: `${expense.id}-mirror` // Ensure unique ID
        };
        
        // Calculate balance for recipient's sheet
        const recipientTransactions = getAllTransactionsFromSheet(recipientSheetData);
        const recipientBalance = calculateBalance(recipientTransactions, recipientEmail, mirroredExpense.userEmail);
        
        // Prepare mirrored row data
        const mirroredRowData = [
          mirroredExpense.id,
          mirroredExpense.timestamp,
          mirroredExpense.userEmail,
          mirroredExpense.name,
          mirroredExpense.type,
          mirroredExpense.amount,
          mirroredExpense.description || '',
          recipientBalance,
          mirroredExpense.countryCode || '+91',
          mirroredExpense.phone || ''
        ];
        
        // Add to recipient's sheet
        recipientSheetData.appendRow(mirroredRowData);
      }
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
    
    const sheetId = ensureUserSheetInternal(userEmail);
    if (!sheetId) {
      return { error: 'Failed to create user sheet' };
    }
    
    const sheet = SpreadsheetApp.openById(sheetId);
    const sheetData = sheet.getActiveSheet();
    
    const transactions = getAllTransactionsFromSheet(sheetData);
    
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
      expense.countryCode || '+91',
      expense.phone || ''
    ];
    
    // Update the row
    const range = sheetData.getRange(rowNumber, 1, 1, rowData.length);
    range.setValues([rowData]);
    
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
    
    // Delete the specific row (rowIndex + 2 because of headers and 0-based index)
    const rowNumber = rowIndex + 2;
    sheetData.deleteRow(rowNumber);
    
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
 * Internal function to ensure user sheet exists
 */
function ensureUserSheetInternal(userEmail) {
  try {
    console.log(`Ensuring sheet exists for user: ${userEmail}`);
    
    // Create or find the main folder
    let folder;
    try {
      // Try to find existing folder first
      const folders = DriveApp.getFoldersByName(APP_NAME);
      if (folders.hasNext()) {
        folder = folders.next();
        console.log(`Found existing folder: ${folder.getName()}`);
      } else {
        // Create folder if it doesn't exist
        folder = DriveApp.createFolder(APP_NAME);
        console.log(`Created new folder: ${folder.getName()}`);
      }
    } catch (folderError) {
      console.error('Error with folder creation:', folderError);
      // Create folder directly if search fails
      folder = DriveApp.createFolder(APP_NAME);
      console.log(`Created folder after error: ${folder.getName()}`);
    }
    
    // Create or find the user's sheet
    const sheetName = `${userEmail}-transactions`;
    let sheet;
    
    try {
      // Try to find existing sheet
      const sheets = DriveApp.getFilesByName(sheetName);
      if (sheets.hasNext()) {
        sheet = sheets.next();
        console.log(`Found existing sheet: ${sheet.getName()}`);
        return sheet.getId();
      }
    } catch (searchError) {
      console.log(`Search for existing sheet failed, will create new one: ${searchError}`);
    }
    
    // Create new sheet if not found
    console.log(`Creating new sheet: ${sheetName}`);
    sheet = SpreadsheetApp.create(sheetName);
    const sheetFile = DriveApp.getFileById(sheet.getId());
    
    // Move sheet to the folder
    try {
      folder.addFile(sheetFile);
      DriveApp.getRootFolder().removeFile(sheetFile);
      console.log(`Moved sheet to folder: ${folder.getName()}`);
    } catch (moveError) {
      console.log(`Could not move sheet to folder, keeping in root: ${moveError}`);
    }
    
    // Add headers
    const sheetData = sheet.getActiveSheet();
    sheetData.getRange(1, 1, 1, HEADERS[0].length).setValues(HEADERS);
    
    // Set text wrapping
    sheetData.getRange(1, 1, 1000, HEADERS[0].length).setWrap(true);
    
    console.log(`Successfully created sheet: ${sheetName} with ID: ${sheet.getId()}`);
    return sheet.getId();
    
  } catch (error) {
    console.error('Error in ensureUserSheetInternal:', error);
    console.error('Error details:', error.toString());
    return null;
  }
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
          countryCode: row[8] || '+91',
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
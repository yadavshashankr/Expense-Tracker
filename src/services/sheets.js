
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const SHEETS_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const headers = [['ID', 'Timestamp', 'User Email', 'Name', 'Type', 'Amount', 'Description', 'Balance', 'Country Code', 'Phone']];

function getReadableError(error, url) {
  const isDriveAPI = url.includes('drive.googleapis.com');
  const isSheetsAPI = url.includes('sheets.googleapis.com');
  
  if (error.message?.includes('API has not been used') || error.message?.includes('disabled')) {
    if (isDriveAPI) {
      return 'Google Drive API access is required. Please sign out, sign in again, and make sure to grant all requested permissions.';
    }
    if (isSheetsAPI) {
      return 'Google Sheets API access is required. Please sign out, sign in again, and make sure to grant all requested permissions.';
    }
    return 'Required Google APIs are not enabled. Please sign out, sign in again, and make sure to grant all requested permissions.';
  }
  
  if (error.message?.includes('insufficient permissions')) {
    if (isDriveAPI) {
      return 'You don\'t have permission to access Google Drive. Please check your permissions and try signing in again.';
    }
    if (isSheetsAPI) {
      return 'You don\'t have permission to access Google Sheets. Please check your permissions and try signing in again.';
    }
    return 'You don\'t have sufficient permissions. Please check your Google Drive and Sheets permissions and try signing in again.';
  }

  if (error.message?.includes('consent')) {
    return 'Additional permissions are required. Please sign out, sign in again, and make sure to grant all requested permissions.';
  }

  return error.message || 'An unknown error occurred. Please try signing out and signing in again.';
}

async function gFetch(url, accessToken, method='GET', body) {
  try {
    console.log(`Making ${method} request to: ${url}`);

    // Configure headers based on the API being called
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Configure request options
    const requestOptions = {
      method,
      headers,
      mode: 'cors',
      ...(body && { body: JSON.stringify(body) })
    };

    // For preflight requests
    if (method !== 'GET') {
      requestOptions.headers['Access-Control-Request-Headers'] = 'authorization,content-type';
      requestOptions.headers['Access-Control-Request-Method'] = method;
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Authentication expired. Please sign out and sign in again.');
      }
      if (response.status === 403) {
        throw new Error('You don\'t have permission to perform this action. Please check your Google Drive and Sheets permissions.');
      }
      if (response.status === 404) {
        if (url.includes('drive.googleapis.com')) {
          throw new Error('Folder or file not found. Please check your Google Drive permissions.');
        } else {
          throw new Error('Spreadsheet not found. Please check your Google Sheets permissions.');
        }
      }
      
      const error = new Error(
        `API Error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return response.json();
  } catch (error) {
    console.error('API Request Failed:', error);
    
    // Handle network errors and CORS issues
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      if (url.includes('drive.googleapis.com')) {
        throw new Error('Unable to access Google Drive. Please check your permissions and try signing out and signing back in.');
      } else {
        throw new Error('Unable to access Google Sheets. Please check your permissions and try signing out and signing back in.');
      }
    }
    
    const readableError = new Error(getReadableError(error, url));
    readableError.originalError = error;
    throw readableError;
  }
}

// Add balance calculation function
const calculateBalance = (transactions, currentUserEmail, targetEmail) => {
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
};

export async function ensureUserSheet({ appName, userName, accessToken }) {
  try {
    // First, search for existing folder
    const folderQuery = encodeURIComponent(`name='${appName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const folderSearchRes = await gFetch(`${DRIVE_FILES_URL}?q=${folderQuery}&fields=files(id,name)`, accessToken);
    
    let folderId;
    
    // Create folder if it doesn't exist
    if (!folderSearchRes.files?.length) {
      console.log('Creating new folder...');
      const createFolderRes = await gFetch(
        DRIVE_FILES_URL,
        accessToken,
        'POST',
        {
          name: appName,
          mimeType: 'application/vnd.google-apps.folder',
          // Ensure folder is created in the root of My Drive
          parents: ['root']
        }
      );
      folderId = createFolderRes.id;
    } else {
      folderId = folderSearchRes.files[0].id;
    }

    // Search for existing sheet
    const sheetQuery = encodeURIComponent(`name='${userName}-transactions' and mimeType='application/vnd.google-apps.spreadsheet' and '${folderId}' in parents and trashed=false`);
    const sheetSearchRes = await gFetch(`${DRIVE_FILES_URL}?q=${sheetQuery}&fields=files(id,name)`, accessToken);

    // Return existing sheet if found
    if (sheetSearchRes.files?.length) {
      return sheetSearchRes.files[0].id;
    }

    // Create new sheet
    console.log('Creating new sheet...');
    const createRes = await gFetch(
      SHEETS_URL,
      accessToken,
      'POST',
      {
        properties: {
          title: `${userName}-transactions`
        }
      }
    );

    if (!createRes.spreadsheetId) {
      throw new Error('Failed to create spreadsheet: No ID returned');
    }

    // Move the sheet to the folder
    await gFetch(
      `${DRIVE_FILES_URL}/${createRes.spreadsheetId}?addParents=${folderId}&removeParents=root`,
      accessToken,
      'PATCH'
    );

    // Add headers
    console.log('Adding headers to new sheet...');
    await gFetch(
      `${SHEETS_URL}/${createRes.spreadsheetId}/values/A1:J1?valueInputOption=RAW`,
      accessToken,
      'PUT',
      { values: headers }
    );

    // Set text wrapping for all cells
    try {
      await setTextWrapping(createRes.spreadsheetId, accessToken);
    } catch (error) {
      console.warn('Failed to set text wrapping on new sheet:', error);
    }

    return createRes.spreadsheetId;
  } catch (error) {
    console.error('Error in ensureUserSheet:', error);
    throw error;
  }
}

async function setTextWrapping(spreadsheetId, accessToken) {
  // First get the sheet ID
  const metadata = await gFetch(
    `${SHEETS_URL}/${spreadsheetId}?fields=sheets.properties.sheetId`,
    accessToken
  );

  if (!metadata.sheets?.[0]?.properties?.sheetId) {
    console.warn('Could not find sheet ID for text wrapping');
    return;
  }

  const sheetId = metadata.sheets[0].properties.sheetId;

  const request = {
    requests: [{
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1000,
          startColumnIndex: 0,
          endColumnIndex: 10
        },
        cell: {
          userEnteredFormat: {
            wrapStrategy: 'WRAP'
          }
        },
        fields: 'userEnteredFormat.wrapStrategy'
      }
    }]
  };

  return gFetch(
    `${SHEETS_URL}/${spreadsheetId}:batchUpdate`,
    accessToken,
    'POST',
    request
  );
}

export async function appendExpense({ spreadsheetId, accessToken, entry, currentUserEmail }) {
  if (!spreadsheetId || !accessToken || !entry || !currentUserEmail) {
    throw new Error('Missing required parameters for appending expense.');
  }

  // Validate entry has required fields
  if (!entry.id || !entry.timestamp || !entry.name || !entry.email || !entry.type || !entry.amount) {
    throw new Error('Invalid expense entry: missing required fields.');
  }

  // Format the entry for the sheet
  const values = [[
    entry.id,
    entry.timestamp,
    entry.userEmail, // Use the email from the entry (form email)
    entry.name,
    entry.type,
    entry.amount,
    entry.description || '',
    '', // Balance will be calculated by the sheet
    entry.countryCode || '+91',
    entry.phone || ''
  ]];

  // Append the row
  await gFetch(
    `${SHEETS_URL}/${spreadsheetId}/values/A2:J2:append?valueInputOption=RAW`,
    accessToken,
    'POST',
    { values }
  );
}

export async function fetchAllRows({ spreadsheetId, accessToken }) {
  const response = await gFetch(
    `${SHEETS_URL}/${spreadsheetId}/values/A2:J`,
    accessToken
  );

  if (!response.values?.length) return [];

  return response.values.map(row => ({
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
  }));
}

export async function updateExpenseRow({ spreadsheetId, accessToken, rowIndex, entry, currentUserEmail }) {
  // Get all transactions to recalculate balances
  const allTransactions = await fetchAllRows({ spreadsheetId, accessToken });
  
  // Update the specific transaction
  allTransactions[rowIndex] = entry;
  
  // Calculate new balance
  const balance = calculateBalance(allTransactions, currentUserEmail, entry.userEmail);

  const values = [[
    entry.id,
    entry.timestamp,
    entry.userEmail,
    entry.name,
    entry.type,
    entry.amount,
    entry.description,
    balance,
    entry.countryCode || '+91',
    entry.phone || ''
  ]];

  // Update the row
  return gFetch(
    `${SHEETS_URL}/${spreadsheetId}/values/A${rowIndex + 2}:J${rowIndex + 2}?valueInputOption=RAW`,
    accessToken,
    'PUT',
    { values }
  );
}

export async function deleteExpenseRow({ spreadsheetId, accessToken, rowIndex }) {
  const body = {
    requests: [{
      deleteDimension: {
        range: {
          sheetId: 0,
          dimension: 'ROWS',
          startIndex: rowIndex - 1,
          endIndex: rowIndex
        }
      }
    }]
  };

  return gFetch(
    `${SHEETS_URL}/${spreadsheetId}:batchUpdate`,
    accessToken,
    'POST',
    body
  );
}

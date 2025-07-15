
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const SHEETS_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

function getReadableError(error, url) {
  // Check which API is being called
  const isDriveAPI = url.includes('drive');
  const isSheetsAPI = url.includes('sheets');
  
  if (error.message?.includes('API has not been used') || error.message?.includes('disabled')) {
    if (isDriveAPI) {
      return 'Google Drive API is not enabled. Please enable it at https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=1031633259679 and wait a few minutes.';
    }
    if (isSheetsAPI) {
      return 'Google Sheets API is not enabled. Please enable it at https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=1031633259679 and wait a few minutes.';
    }
    return 'Required Google APIs are not enabled. Please enable both Google Drive and Sheets APIs and wait a few minutes.';
  }
  
  if (error.message?.includes('insufficient permissions')) {
    return 'You don\'t have permission to access Google Drive or Sheets. Please make sure you\'ve granted all required permissions and try logging in again.';
  }

  if (error.message?.includes('consent')) {
    return 'Required permissions are missing. Please sign out, sign in again, and make sure to grant all requested permissions.';
  }

  return error.message || 'An unknown error occurred';
}

async function gFetch(url, accessToken, method='GET', body) {
  try {
    console.log(`Making ${method} request to: ${url}`);
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      ...(body && { body: JSON.stringify(body) })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
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
    const readableError = new Error(getReadableError(error, url));
    readableError.originalError = error;
    throw readableError;
  }
}

// Add balance calculation function
const calculateBalance = (transactions, currentUserEmail, otherUserEmail) => {
  return transactions.reduce((balance, transaction) => {
    const amount = parseFloat(transaction.amount);
    // If current user received money (credit)
    if (transaction.userEmail === currentUserEmail && transaction.type === 'credit') {
      return balance + amount;
    }
    // If current user paid money (debit)
    if (transaction.userEmail === currentUserEmail && transaction.type === 'debit') {
      return balance - amount;
    }
    // If other user paid money (their debit is our credit)
    if (transaction.userEmail === otherUserEmail && transaction.type === 'debit') {
      return balance + amount;
    }
    // If other user received money (their credit is our debit)
    if (transaction.userEmail === otherUserEmail && transaction.type === 'credit') {
      return balance - amount;
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
          mimeType: 'application/vnd.google-apps.folder'
        }
      );
      folderId = createFolderRes.id;
    } else {
      folderId = folderSearchRes.files[0].id;
    }

    // Search for existing sheet in the folder
    const sheetQuery = encodeURIComponent(`name='${userName}' and mimeType='application/vnd.google-apps.spreadsheet' and '${folderId}' in parents and trashed=false`);
    const sheetSearchRes = await gFetch(`${DRIVE_FILES_URL}?q=${sheetQuery}&fields=files(id,name)`, accessToken);
    
    if (sheetSearchRes.files?.length) {
      console.log('Found existing sheet:', sheetSearchRes.files[0].id);
      try {
        await setTextWrapping(sheetSearchRes.files[0].id, accessToken);
      } catch (error) {
        console.warn('Failed to set text wrapping on existing sheet:', error);
      }
      return sheetSearchRes.files[0].id;
    }

    // Create new spreadsheet
    console.log('Creating new sheet...');
    const createRes = await gFetch(
      SHEETS_URL,
      accessToken,
      'POST',
      {
        properties: {
          title: userName,
        },
        sheets: [{
          properties: {
            title: 'Expenses',
            gridProperties: {
              rowCount: 1000,
              columnCount: 9 // Added one more column for balance
            }
          }
        }]
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
    const headers = [['ID', 'Timestamp', 'User Email', 'Name', 'Type', 'Amount', 'Description', 'Group ID', 'Balance']];
    await gFetch(
      `${SHEETS_URL}/${createRes.spreadsheetId}/values/A1:I1?valueInputOption=RAW`,
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
          endColumnIndex: 8
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
  // First get all existing transactions to calculate the new balance
  const existingTransactions = await fetchAllRows({ spreadsheetId, accessToken });
  const balance = calculateBalance([...existingTransactions, entry], currentUserEmail, entry.userEmail);

  const values = [[
    entry.id,
    entry.timestamp,
    entry.userEmail,
    entry.name,
    entry.type,
    entry.amount,
    entry.description,
    '',  // Group ID
    balance.toFixed(2) // Add balance
  ]];

  return gFetch(
    `${SHEETS_URL}/${spreadsheetId}/values/A2:I2:append?valueInputOption=USER_ENTERED`,
    accessToken,
    'POST',
    { values }
  );
}

export async function fetchAllRows({ spreadsheetId, accessToken }) {
  try {
    const res = await gFetch(
      `${SHEETS_URL}/${spreadsheetId}/values/Expenses!A2:I10000`,
      accessToken
    );

    if (!res.values) return [];

    return res.values.map(([id, timestamp, userEmail, name, type, amount, description, groupId, balance], i) => ({
      id,
      timestamp,
      userEmail,
      name,
      type,
      amount,
      description,
      balance: balance || '0.00',
      rowIndex: i + 2
    }));
  } catch (error) {
    console.error('Error fetching rows:', error);
    return [];
  }
}

export async function updateExpenseRow({ spreadsheetId, accessToken, rowIndex, entry, currentUserEmail }) {
  // Get all transactions to recalculate balance
  const allTransactions = await fetchAllRows({ spreadsheetId, accessToken });
  // Replace the transaction at rowIndex with the new entry
  allTransactions[rowIndex - 2] = { ...entry, rowIndex };
  // Calculate new balance
  const balance = calculateBalance(allTransactions.slice(0, rowIndex - 1), currentUserEmail, entry.userEmail);

  const range = `Expenses!A${rowIndex}:I${rowIndex}`;
  const values = [[
    entry.id,
    entry.timestamp,
    entry.userEmail,
    entry.name,
    entry.type,
    entry.amount,
    entry.description,
    '',  // Group ID
    balance.toFixed(2) // Add balance
  ]];

  return gFetch(
    `${SHEETS_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
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

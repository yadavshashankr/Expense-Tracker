
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

export async function ensureUserSheet({ appName, userName, accessToken }) {
  try {
    // First, search for existing sheet
    const query = encodeURIComponent(`name='${appName}/${userName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
    const searchRes = await gFetch(`${DRIVE_FILES_URL}?q=${query}&fields=files(id,name)`, accessToken);
    
    if (searchRes.files?.length) {
      console.log('Found existing sheet:', searchRes.files[0].id);
      return searchRes.files[0].id;
    }

    // Create new spreadsheet
    console.log('Creating new sheet...');
    const createRes = await gFetch(
      SHEETS_URL,
      accessToken,
      'POST',
      {
        properties: {
          title: `${appName}/${userName}`,
        },
        sheets: [{
          properties: {
            title: 'Expenses',
            gridProperties: {
              rowCount: 1000,
              columnCount: 8
            }
          }
        }]
      }
    );

    if (!createRes.spreadsheetId) {
      throw new Error('Failed to create spreadsheet: No ID returned');
    }

    // Add headers
    console.log('Adding headers to new sheet...');
    const headers = [['ID', 'Timestamp', 'User Email', 'Counterparty Email', 'Type', 'Amount', 'Description', 'Group ID']];
    await gFetch(
      `${SHEETS_URL}/${createRes.spreadsheetId}/values/A1:H1?valueInputOption=RAW`,
      accessToken,
      'PUT',
      { values: headers }
    );

    return createRes.spreadsheetId;
  } catch (error) {
    console.error('Error in ensureUserSheet:', error);
    throw error;
  }
}

export async function appendExpense({ spreadsheetId, accessToken, entry }) {
  const values = [[
    entry.id,
    entry.timestamp,
    entry.userEmail,
    entry.counterparty,
    entry.type,
    entry.amount,
    entry.description,
    ''
  ]];

  return gFetch(
    `${SHEETS_URL}/${spreadsheetId}/values/A2:H2:append?valueInputOption=USER_ENTERED`,
    accessToken,
    'POST',
    { values }
  );
}

export async function fetchAllRows({ spreadsheetId, accessToken }) {
  const res = await gFetch(
    `${SHEETS_URL}/${spreadsheetId}/values/Expenses!A2:H10000`,
    accessToken
  );

  if (!res.values) return [];

  return res.values.map(([id, timestamp, userEmail, counterparty, type, amount, description], i) => ({
    id,
    timestamp,
    userEmail,
    counterparty,
    type,
    amount,
    description,
    rowIndex: i + 2
  }));
}

export async function updateExpenseRow({ spreadsheetId, accessToken, rowIndex, entry }) {
  const range = `Expenses!A${rowIndex}:H${rowIndex}`;
  const values = [[
    entry.id,
    entry.timestamp,
    entry.userEmail,
    entry.counterparty,
    entry.type,
    entry.amount,
    entry.description,
    ''
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

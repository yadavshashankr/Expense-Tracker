// src/services/sheets.js (Frontend file)

const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzSHCIVdrESHX4pes3EPiVSfb7Uz75g8b9VqXbTx2JGvaVjYGv2dd196KqLiG99rogkMQ/exec';

async function callAppsScript(functionName, args) {
  try {
    console.log(`Calling Apps Script function: ${functionName} with args:`, args);
    
    // Try with different CORS approach
    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit', // Don't send credentials
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ function: functionName, args: args }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP Error response from Apps Script:', errorText);
      throw new Error(`Apps Script HTTP Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.success) {
      console.error('Apps Script reported an error:', data.error);
      throw new Error(data.error || 'Apps Script function failed.');
    }
    return data.data;
  } catch (error) {
    console.error('Error calling Apps Script:', error);
    // Add more descriptive error message
    if (error.message === 'Failed to fetch') {
      throw new Error('CORS Error: Unable to connect to Google Apps Script. Please ensure the Apps Script has proper CORS headers and is deployed correctly.');
    }
    throw error;
  }
}

export async function ensureUserSheet({ appName, userName }) {
  return callAppsScript('ensureUserSheet', { appName, userName });
}

export async function appendExpense({ spreadsheetId, entry, currentUserEmail }) {
  return callAppsScript('appendExpense', { spreadsheetId, entry, currentUserEmail });
}

export async function fetchAllRows({ spreadsheetId }) {
  return callAppsScript('fetchAllRows', { spreadsheetId });
}

export async function updateExpenseRow({ spreadsheetId, rowIndex, entry, currentUserEmail }) {
  return callAppsScript('updateExpenseRow', { spreadsheetId, rowIndex, entry, currentUserEmail });
}

export async function deleteExpenseRow({ spreadsheetId, rowIndex }) {
  return callAppsScript('deleteExpenseRow', { spreadsheetId, rowIndex });
}
// src/services/sheets.js (Frontend file)

const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzSHCIVdrESHX4pes3EPiVSfb7Uz75g8b9VqXbTx2JGvaVjYGv2dd196KqLiG99rogkMQ/exec';

async function callAppsScript(action, params = {}) {
  try {
    console.log(`Calling Apps Script action: ${action} with params:`, params);
    
    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...params }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP Error response from Apps Script:', errorText);
      throw new Error(`Apps Script HTTP Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error('Apps Script reported an error:', data.error);
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Error calling Apps Script:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('CORS Error: Unable to connect to Google Apps Script. Please ensure the Apps Script has proper CORS headers and is deployed correctly.');
    }
    throw error;
  }
}

export async function addTransaction(transactionData) {
  return callAppsScript('addTransaction', transactionData);
}

export async function getTransactions(filters = {}) {
  return callAppsScript('getTransactions', filters);
}

export async function updateTransaction(transactionData) {
  return callAppsScript('updateTransaction', transactionData);
}

export async function deleteTransaction(rowIndex) {
  return callAppsScript('deleteTransaction', { rowIndex });
}

export async function getBalance() {
  return callAppsScript('getBalance');
}

// Legacy function names for backward compatibility
export async function appendExpense({ spreadsheetId, entry, currentUserEmail }) {
  return addTransaction(entry);
}

export async function fetchAllRows({ spreadsheetId }) {
  return getTransactions();
}

export async function updateExpenseRow({ spreadsheetId, rowIndex, entry, currentUserEmail }) {
  return updateTransaction({ rowIndex, ...entry });
}

export async function deleteExpenseRow({ spreadsheetId, rowIndex }) {
  return deleteTransaction(rowIndex);
}

export async function ensureUserSheet({ appName, userName }) {
  // This function is no longer needed with the new approach
  return { success: true };
}
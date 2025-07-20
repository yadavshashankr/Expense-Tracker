// src/services/sheets.js (Frontend file)

const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzrsE84Ng3z2klgxhHKf7jC77DZotLGnrQmL0EkZ97N97KEIjX7nX89pjH4xwJrX6FH/exec'; // *** IMPORTANT: Replace with your actual deployed Apps Script Web App URL ***

async function callAppsScript(functionName, args) {
  try {
    console.log(`Calling Apps Script function: ${functionName} with args:`, args);
    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
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
    throw error;
  }
}

export async function ensureUserSheet({ appName, userName, accessToken }) { // accessToken is no longer used for GAS calls
  return callAppsScript('ensureUserSheet', { appName, userName });
}

export async function appendExpense({ spreadsheetId, accessToken, entry, currentUserEmail }) { // accessToken is no longer used for GAS calls
  return callAppsScript('appendExpense', { spreadsheetId, entry, currentUserEmail });
}

export async function fetchAllRows({ spreadsheetId, accessToken }) { // accessToken is no longer used for GAS calls
  return callAppsScript('fetchAllRows', { spreadsheetId });
}

export async function updateExpenseRow({ spreadsheetId, accessToken, rowIndex, entry, currentUserEmail }) { // accessToken is no longer used for GAS calls
  return callAppsScript('updateExpenseRow', { spreadsheetId, rowIndex, entry, currentUserEmail });
}

export async function deleteExpenseRow({ spreadsheetId, accessToken, rowIndex }) { // accessToken is no longer used for GAS calls
  return callAppsScript('deleteExpenseRow', { spreadsheetId, rowIndex });
}
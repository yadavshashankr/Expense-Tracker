// Google Apps Script Service
// This service handles all communication with the Google Apps Script backend

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtY8y4FNj14GTM07NvnrHvozOtw8a2lJd3e5a-5ko_m0GiNOqGqLCK8YIPGsCXa-QlQw/exec';

/**
 * Generic function to call Google Apps Script
 */
async function callAppsScript(action, data) {
  try {
    console.log(`Calling Apps Script with action: ${action}`, data);
    
    // Use a different approach to avoid CORS issues
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...data
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`Apps Script response for ${action}:`, result);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error(`Error calling Apps Script (${action}):`, error);
    throw new Error(`Apps Script call failed: ${error.message}`);
  }
}

/**
 * Add expense to user's sheet and create mirrored transaction for recipient
 */
export async function addExpense(userEmail, expense, recipientEmail = null) {
  return callAppsScript('addExpense', {
    userEmail,
    expense,
    recipientEmail
  });
}

/**
 * Get all expenses for a user
 */
export async function getExpenses(userEmail) {
  return callAppsScript('getExpenses', { userEmail });
}

/**
 * Update an existing expense
 */
export async function updateExpense(userEmail, rowIndex, expense) {
  return callAppsScript('updateExpense', {
    userEmail,
    rowIndex,
    expense
  });
}

/**
 * Delete an expense
 */
export async function deleteExpense(userEmail, rowIndex) {
  return callAppsScript('deleteExpense', {
    userEmail,
    rowIndex
  });
}

/**
 * Ensure user sheet exists
 */
export async function ensureUserSheet(userEmail) {
  return callAppsScript('ensureUserSheet', { userEmail });
}

/**
 * Test connection to Apps Script backend
 */
export async function testConnection() {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error testing Apps Script connection:', error);
    throw new Error(`Connection test failed: ${error.message}`);
  }
} 
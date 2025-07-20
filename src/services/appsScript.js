// Google Apps Script Service
// This service handles all communication with the Google Apps Script backend

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw725GMxCP9n69T8lDt3NjuZDYoesYYqJoib9Zwu5iccxyHs0qxSauSZj4LshUyhTBVQg/exec';

/**
 * Generic function to call Google Apps Script
 */
async function callAppsScript(action, data) {
  try {
    console.log(`Calling Apps Script with action: ${action}`, data);
    
    // Enhanced error handling and debugging for CORS issues
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...data
      })
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error(`Non-JSON response: ${textResponse}`);
      throw new Error(`Expected JSON response but got: ${contentType}`);
    }
    
    const result = await response.json();
    console.log(`Apps Script response for ${action}:`, result);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error(`Error calling Apps Script (${action}):`, error);
    
    // Enhanced error logging for CORS issues
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      console.error('CORS Error detected. Please check:');
      console.error('1. Apps Script deployment settings (Who has access: Anyone)');
      console.error('2. Apps Script URL is correct');
      console.error('3. No OAuth2 conflicts in Google Cloud Console');
    }
    
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
    console.log('Testing Apps Script connection...');
    console.log('URL:', APPS_SCRIPT_URL);
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'GET',
      mode: 'cors'
    });
    
    console.log(`Test response status: ${response.status}`);
    console.log(`Test response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Test HTTP error response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Test connection successful:', result);
    return result;
  } catch (error) {
    console.error('Error testing Apps Script connection:', error);
    
    // Enhanced error logging for CORS issues
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      console.error('CORS Error detected in test connection. Please check:');
      console.error('1. Apps Script deployment settings (Who has access: Anyone)');
      console.error('2. Apps Script URL is correct');
      console.error('3. No OAuth2 conflicts in Google Cloud Console');
    }
    
    throw new Error(`Connection test failed: ${error.message}`);
  }
} 
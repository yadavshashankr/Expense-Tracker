// Google Apps Script Service
// This service handles all communication with the Google Apps Script backend

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw725GMxCP9n69T8lDt3NjuZDYoesYYqJoib9Zwu5iccxyHs0qxSauSZj4LshUyhTBVQg/exec';

// Frontend Performance Optimization: Caching and Request Management
const requestCache = new Map();
const pendingRequests = new Map();
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Debounced request function to prevent duplicate requests
 */
function debounceRequest(key, requestFn, delay = 300) {
  if (pendingRequests.has(key)) {
    console.log(`Using pending request for key: ${key}`);
    return pendingRequests.get(key);
  }
  
  const promise = new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await requestFn();
        requestCache.set(key, {
          data: result,
          timestamp: Date.now()
        });
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        pendingRequests.delete(key);
      }
    }, delay);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Get cached data if available and not expired
 */
function getCachedData(key) {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached data for key: ${key}`);
    return cached.data;
  }
  return null;
}

/**
 * Clear cache for a specific key
 */
function clearCache(key) {
  if (requestCache.has(key)) {
    requestCache.delete(key);
    console.log(`Cleared cache for key: ${key}`);
  }
}

/**
 * Generic function to call Google Apps Script
 */
async function callAppsScript(action, data) {
  try {
    console.log(`Calling Apps Script with action: ${action}`, data);
    
    // Try using form data instead of JSON to avoid CORS preflight
    const formData = new FormData();
    formData.append('action', action);
    
    // Convert data object to form data
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'object') {
        formData.append(key, JSON.stringify(data[key]));
        console.log(`FormData: ${key} = ${JSON.stringify(data[key])}`);
      } else {
        formData.append(key, data[key]);
        console.log(`FormData: ${key} = ${data[key]}`);
      }
    });
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      body: formData
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
 * Add expense to user's sheet
 */
export async function addExpense(userEmail, expense) {
  // Clear cache since we're adding new data
  clearCache(`expenses_${userEmail}`);
  
  return callAppsScript('addExpense', {
    userEmail,
    expense
  });
}

/**
 * Get all expenses for a user (with caching)
 */
export async function getExpenses(userEmail) {
  const cacheKey = `expenses_${userEmail}`;
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Use debounced request to prevent duplicate calls
  return debounceRequest(cacheKey, async () => {
    try {
      console.log(`Getting expenses for user: ${userEmail}`);
      
      // Use GET request for read-only operations to avoid CORS preflight
      const url = `${APPS_SCRIPT_URL}?action=getExpenses&userEmail=${encodeURIComponent(userEmail)}`;
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      console.log(`Get expenses response status: ${response.status}`);
      console.log(`Get expenses response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Get expenses HTTP error response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Get expenses successful:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw new Error(`Get expenses failed: ${error.message}`);
    }
  });
}

/**
 * Update an existing expense
 */
export async function updateExpense(userEmail, rowIndex, expense) {
  // Clear cache since we're updating data
  clearCache(`expenses_${userEmail}`);
  
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
  // Clear cache since we're deleting data
  clearCache(`expenses_${userEmail}`);
  
  return callAppsScript('deleteExpense', {
    userEmail,
    rowIndex
  });
}

/**
 * Ensure user sheet exists (with caching)
 */
export async function ensureUserSheet(userEmail) {
  const cacheKey = `sheet_${userEmail}`;
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Use debounced request to prevent duplicate calls
  return debounceRequest(cacheKey, async () => {
    try {
      console.log(`Ensuring sheet exists for user: ${userEmail}`);
      
      // Use GET request for read-only operations to avoid CORS preflight
      const url = `${APPS_SCRIPT_URL}?action=ensureUserSheet&userEmail=${encodeURIComponent(userEmail)}`;
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      console.log(`Ensure sheet response status: ${response.status}`);
      console.log(`Ensure sheet response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Ensure sheet HTTP error response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Ensure sheet successful:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error ensuring user sheet:', error);
      throw new Error(`Ensure user sheet failed: ${error.message}`);
    }
  });
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

/**
 * Clear all cache (useful for debugging or force refresh)
 */
export function clearAllCache() {
  requestCache.clear();
  pendingRequests.clear();
  console.log('Cleared all cache and pending requests');
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getCacheStats() {
  return {
    cacheSize: requestCache.size,
    pendingRequests: pendingRequests.size,
    cacheKeys: Array.from(requestCache.keys()),
    pendingKeys: Array.from(pendingRequests.keys())
  };
} 
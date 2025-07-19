
import { useEffect, useState } from 'react'
import LoginButton from './components/LoginButton'
import ExpenseForm from './components/ExpenseForm'
import ExpenseTable from './components/ExpenseTable'
import TotalSection from './components/TotalSection'
import FilterButton from './components/FilterButton'
import CurrencySelect, { currencies } from './components/CurrencySelect'
import { ensureUserSheet, fetchAllRows, appendExpense, updateExpenseRow, deleteExpenseRow } from './services/sheets'

function App() {
  const [user, setUser] = useState(null)
  const [spreadsheetId, setSpreadsheetId] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeFilters, setActiveFilters] = useState(() => {
    const savedFilters = localStorage.getItem('expenseTrackerFilters');
    return savedFilters ? JSON.parse(savedFilters) : null;
  });

  // Add currency state with user's locale detection
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    try {
      // Default to INR
      const defaultCurrency = currencies.find(c => c.code === 'INR');
      if (!user) return defaultCurrency;

      // Try to get country from user's email domain
      const emailDomain = user.email.split('@')[1];
      const countryMap = {
        'gmail.com': 'IN',
        'outlook.com': 'US',
        'hotmail.com': 'US',
        'yahoo.com': 'US',
        'yahoo.co.uk': 'GB',
        'yahoo.co.in': 'IN',
        'yahoo.co.jp': 'JP'
      };

      // Map country codes to currencies
      const currencyByRegion = {
        'IN': 'INR',
        'US': 'USD',
        'GB': 'GBP',
        'EU': 'EUR',
        'JP': 'JPY',
        'AU': 'AUD',
        'CA': 'CAD',
        'SG': 'SGD'
      };

      // Try to get country from email domain
      const countryCode = countryMap[emailDomain];
      if (countryCode) {
        const currencyCode = currencyByRegion[countryCode];
        const currency = currencies.find(c => c.code === currencyCode);
        if (currency) return currency;
      }

      // If no match found, try browser's locale
      const userLocale = navigator.language;
      const userRegion = new Intl.Locale(userLocale).region;
      const localeCurrencyCode = currencyByRegion[userRegion];
      if (localeCurrencyCode) {
        const currency = currencies.find(c => c.code === localeCurrencyCode);
        if (currency) return currency;
      }

      // Default to INR if no matches found
      return defaultCurrency;
    } catch (error) {
      // Default to INR if any error occurs
      return currencies.find(c => c.code === 'INR');
    }
  });

  // Function to fetch expenses
  const fetchExpenses = async () => {
    if (!spreadsheetId || !user) return;
    
    try {
      setIsRefreshing(true);
      const rows = await fetchAllRows({
        spreadsheetId,
        accessToken: user.accessToken
      });
      setExpenses(rows);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to fetch expenses: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize sheet and fetch initial data
  useEffect(() => {
    if (!user) return;

    const initializeSheet = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const sheetId = await ensureUserSheet({
          appName: 'ExpenseTracker',
          userName: user.profile.email,
          accessToken: user.accessToken
        });
        setSpreadsheetId(sheetId);
        
        // Fetch initial data
        const rows = await fetchAllRows({
          spreadsheetId: sheetId,
          accessToken: user.accessToken
        });
        setExpenses(rows);
      } catch (err) {
        console.error('Error creating/finding sheet:', err);
        setError(err.message);
        // If it's an API enablement issue, we should log out the user
        if (err.message?.includes('API') && err.message?.includes('not enabled')) {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeSheet();
  }, [user]);

  // Auto-refresh expenses every 30 seconds
  useEffect(() => {
    if (!spreadsheetId || !user) return;

    const intervalId = setInterval(fetchExpenses, 30000);
    return () => clearInterval(intervalId);
  }, [spreadsheetId, user]);

  const handleAddExpense = async (expense) => {
    try {
      setError(null);
      // Close form immediately
      setShowAddForm(false);
      // Show loading state
      setIsSubmitting(true);
      
      await appendExpense({
        spreadsheetId,
        accessToken: user.accessToken,
        entry: expense,
        currentUserEmail: user.profile.email
      });
      
      // Refresh expenses
      await fetchExpenses();
    } catch (err) {
      console.error('Error adding expense:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExpense = async (rowIndex, expense) => {
    try {
      setError(null);
      await updateExpenseRow({
        spreadsheetId,
        accessToken: user.accessToken,
        rowIndex,
        entry: expense,
        currentUserEmail: user.profile.email
      });
      
      // Refresh expenses
      await fetchExpenses();
    } catch (err) {
      console.error('Error updating expense:', err);
      setError(err.message);
    }
  };

  const handleDeleteExpense = async (rowIndex) => {
    try {
      setError(null);
      await deleteExpenseRow({
        spreadsheetId,
        accessToken: user.accessToken,
        rowIndex
      });
      
      // Refresh expenses
      await fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError(err.message);
    }
  };

  // Function to handle filter application
  const handleApplyFilters = (filters) => {
    // Convert empty string values to null
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [key, value === '' ? null : value])
    );

    // Only set filters if at least one filter has a value
    const hasActiveFilters = Object.values(cleanedFilters).some(value => value !== null);
    const newFilters = hasActiveFilters ? cleanedFilters : null;
    
    // Save all filters including phone number
    setActiveFilters(newFilters);
    if (newFilters) {
      localStorage.setItem('expenseTrackerFilters', JSON.stringify(newFilters));
    } else {
      localStorage.removeItem('expenseTrackerFilters');
    }
  };

  // Function to handle opening add transaction popup
  const handleOpenAddForm = () => {
    // Reset all filters including phone number when opening add form
    setActiveFilters(null);
    localStorage.removeItem('expenseTrackerFilters');
    setShowAddForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!user ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">Expense Tracker</h1>
          <LoginButton onLogin={setUser} />
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          {/* Fixed Header */}
          <div className="flex-none bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold">Expense Tracker</h1>
                <div className="flex items-center gap-4">
                  <button
                    onClick={fetchExpenses}
                    disabled={isRefreshing}
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={() => setUser(null)}
                    className="text-gray-600 hover:text-gray-800 text-sm sm:text-base"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Total Section */}
          <div className="flex-none bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Section */}
              {expenses.length > 0 && (
                <TotalSection 
                  expenses={expenses} 
                  currentUserEmail={user.profile.email}
                  currency={selectedCurrency}
                  onCurrencyChange={setSelectedCurrency}
                />
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto">
              {isLoading || isSubmitting ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-gray-600">{isSubmitting ? 'Adding transaction...' : 'Loading...'}</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <ExpenseTable
                    expenses={expenses}
                    onEdit={handleUpdateExpense}
                    onDelete={handleDeleteExpense}
                    currentUserEmail={user.profile.email}
                    activeFilters={activeFilters}
                    currency={selectedCurrency}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Container */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-4 items-center z-10">
            {/* Currency Selector Button */}
            <div className="relative">
              <CurrencySelect
                value={selectedCurrency.code}
                onChange={setSelectedCurrency}
                renderButton={({ selectedCurrency, onClick }) => (
                  <button
                    onClick={onClick}
                    className="bg-white text-gray-700 p-4 rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
                    aria-label="Change Currency"
                  >
                    <div className="flex items-center text-lg font-medium">
                      {selectedCurrency.symbol}
                    </div>
                  </button>
                )}
              />
            </div>

            {/* Filter Button */}
            <FilterButton 
              onApplyFilters={handleApplyFilters}
              initialFilters={activeFilters}
              isActive={!!activeFilters}
              expenses={expenses}
            />

            {/* Add Transaction Button */}
            <button
              onClick={handleOpenAddForm}
              className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
              aria-label="Add Transaction"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Add Transaction</h2>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <ExpenseForm
                    onSubmit={handleAddExpense}
                    currentUserEmail={user.profile.email}
                    expenses={expenses}
                    currency={selectedCurrency}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

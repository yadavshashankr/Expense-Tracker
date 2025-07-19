
import { useEffect, useState, useRef } from 'react'
import LoginButton from './components/LoginButton'
import ExpenseForm from './components/ExpenseForm'
import ExpenseTable from './components/ExpenseTable'
import TotalSection from './components/TotalSection'
import CurrencySelect, { currencies } from './components/CurrencySelect'
import FilterPopup from './components/FilterPopup'
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const menuRef = useRef(null);
  const [activeFilters, setActiveFilters] = useState(() => {
    const savedFilters = localStorage.getItem('expenseTrackerFilters');
    return savedFilters ? JSON.parse(savedFilters) : null;
  });

  // Handle user login
  const handleLogin = (userData) => {
    if (!userData?.profile?.email || !userData?.accessToken) {
      setError('Invalid login data. Please try signing in again.');
      return;
    }
    setUser(userData);
    setError(null);
  };

  // Handle click outside for menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setActiveFilters(filters);
    setShowFilters(false);
    if (filters) {
      localStorage.setItem('expenseTrackerFilters', JSON.stringify(filters));
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

  // Handle menu and popup actions
  const handleAddTransaction = () => {
    setIsMenuOpen(false);
    setShowAddForm(true);
  };

  const handleFilterClick = () => {
    setIsMenuOpen(false);
    setShowFilters(true);
  };

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
    setIsMenuOpen(false);
  };

  const handleAddExpense = async (entry) => {
    try {
      if (!user?.profile?.email) {
        throw new Error('Please sign in to add transactions.');
      }

      setError(null);
      setShowAddForm(false);
      setIsMenuOpen(false);
      setIsSubmitting(true);

      await appendExpense({
        spreadsheetId,
        accessToken: user.accessToken,
        entry, // Use the entry as is, with the form's email
        currentUserEmail: user.profile.email // Use profile.email consistently
      });

      await fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      setError(error.message);
      setShowAddForm(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {!user ? (
        <LoginButton onLogin={handleLogin} />
      ) : (
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Expense Tracker</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {user.profile.email}
              </div>
              <button
                onClick={() => setUser(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Menu Button */}
          <div ref={menuRef} className="fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>

            {/* Action Icons */}
            {isMenuOpen && (
              <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Transaction
                </button>
                <button
                  onClick={() => {
                    setShowFilters(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            {showAddForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
                  <ExpenseForm
                    onSubmit={handleAddExpense}
                    currentUserEmail={user.profile.email}
                    expenses={expenses}
                  />
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showFilters && (
              <FilterPopup
                onClose={() => setShowFilters(false)}
                onApply={handleApplyFilters}
                initialFilters={activeFilters}
                expenses={expenses}
              />
            )}

            <ExpenseTable
              expenses={expenses}
              currentUserEmail={user.profile.email}
              onUpdate={handleUpdateExpense}
              onDelete={handleDeleteExpense}
              activeFilters={activeFilters}
              selectedCurrency={selectedCurrency}
            />

            <TotalSection
              expenses={expenses}
              currentUserEmail={user.profile.email}
              selectedCurrency={selectedCurrency}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

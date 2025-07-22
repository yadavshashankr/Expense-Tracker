
import { useEffect, useState, useRef } from 'react'
import LoginButton from './components/LoginButton'
import ExpenseForm from './components/ExpenseForm'
import ExpenseTable from './components/ExpenseTable'
import TotalSection from './components/TotalSection'
import CurrencySelect, { currencies } from './components/CurrencySelect'
import FilterPopup from './components/FilterPopup'
import { addExpense, getExpenses, updateExpense, deleteExpense, ensureUserSheet, testConnection } from './services/firestore';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from './services/firebase';

function App() {
  const [user, setUser] = useState(null)
  const [spreadsheetId, setSpreadsheetId] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false); // For floating menu (3 lines)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // For profile dropdown
  const [showFilters, setShowFilters] = useState(false);
  const menuRef = useRef(null); // For floating menu
  const profileMenuRef = useRef(null); // For profile dropdown
  const [activeFilters, setActiveFilters] = useState(() => {
    const savedFilters = localStorage.getItem('expenseTrackerFilters');
    return savedFilters ? JSON.parse(savedFilters) : null;
  });

  // Click outside for profile dropdown only
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  // Initialize currency state with default INR
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const defaultCurrency = currencies.find(c => c.code === 'INR');
    
    try {
      if (!user?.profile?.email) return defaultCurrency;

      // Try to get country from user's email domain
      const emailDomain = user.profile.email.split('@')[1];
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
      return defaultCurrency;
    }
  });

  // Function to fetch expenses
  const fetchExpenses = async () => {
    if (!user?.profile?.email) return;
    
    try {
      setIsRefreshing(true);
      const result = await getExpenses(user.profile.email);
      setExpenses(result.expenses || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to fetch expenses: ' + err.message);
      
      // If we get a sheet-related error, clear the stored sheet ID
      if (err.message.includes('sheet') || err.message.includes('not found')) {
        localStorage.removeItem(`sheetId_${user.profile.email}`);
        console.log('Cleared stored sheet ID due to error');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize sheet and fetch initial data
  useEffect(() => {
    if (!user?.profile?.email) return;

    const initializeSheet = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if we already have a valid sheet ID stored locally
        const storedSheetId = localStorage.getItem(`sheetId_${user.profile.email}`);
        
        if (storedSheetId) {
          console.log(`Using stored sheet ID: ${storedSheetId}`);
          setSpreadsheetId(storedSheetId);
          // Try to fetch expenses directly with stored sheet ID
          try {
            await fetchExpenses();
            return; // Success, no need to ensure sheet
          } catch (fetchError) {
            console.log('Stored sheet ID failed, will ensure sheet exists:', fetchError);
            // If fetch fails, clear stored ID and ensure sheet exists
            localStorage.removeItem(`sheetId_${user.profile.email}`);
          }
        }
        
        // Ensure user sheet exists (Apps Script will create it if needed)
        console.log('Ensuring sheet exists for user:', user.profile.email);
        const result = await ensureUserSheet(user.profile.email);
        if (result.sheetId) {
          setSpreadsheetId(result.sheetId);
          // Store the sheet ID locally for future use
          localStorage.setItem(`sheetId_${user.profile.email}`, result.sheetId);
          console.log(`Stored sheet ID locally: ${result.sheetId}`);
        }
        
        // Fetch initial data
        await fetchExpenses();
      } catch (err) {
        console.error('Error initializing sheet:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSheet();
  }, [user]);

  // Remove the 30-second polling useEffect and add a real-time Firestore listener
  useEffect(() => {
    if (!user?.profile?.email) return;
    const expensesRef = collection(db, 'users', user.profile.email, 'expenses');
    const q = query(expensesRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setExpenses(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddExpense = async (expense) => {
    try {
      if (!user?.profile?.email) {
        throw new Error('Please sign in to add transactions.');
      }

      setError(null);
      // Close form immediately
      setShowAddForm(false);
      // Show loading state
      setIsSubmitting(true);
      
      // Add expense using Firestore
      await addExpense(
        user.profile.email, // Current user's email
        expense,           // Expense data
        user.profile.name, // Sender's name
        '-',               // Sender's phone (always '-')
        user.profile.email // Sender's email
      );
      
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
      if (!user?.profile?.email) {
        throw new Error('Please sign in to update transactions.');
      }

      setError(null);
      await updateExpense(
        user.profile.email,
        rowIndex,
        expense
      );
      
      // Refresh expenses
      await fetchExpenses();
    } catch (err) {
      console.error('Error updating expense:', err);
      setError(err.message);
    }
  };

  const handleDeleteExpense = async (rowIndex) => {
    try {
      if (!user?.profile?.email) {
        throw new Error('Please sign in to delete transactions.');
      }

      setError(null);
      await deleteExpense(
        user.profile.email,
        rowIndex
      );
      
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

  // Test Apps Script connection
  const handleTestConnection = async () => {
    try {
      setError(null);
      console.log('Testing Apps Script connection...');
      const result = await testConnection();
      console.log('Connection test result:', result);
      alert('Connection test successful! Check console for details.');
    } catch (err) {
      console.error('Connection test failed:', err);
      setError('Connection test failed: ' + err.message);
    }
  };

  // Helper to get first name
  const getFirstName = (fullName) => (fullName ? fullName.split(' ')[0] : '');

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
                <h1 className="text-base sm:text-2xl font-bold truncate max-w-[60vw] sm:max-w-none">
                  Expense Tracker | Welcome, {getFirstName(user?.profile?.name)}
                </h1>
                <div className="flex items-center gap-4 relative">
                  {/* User photo with dropdown for sign out, robust click outside */}
                  <div className="relative" ref={profileMenuRef}>
                    <img
                      src={user?.profile?.picture}
                      alt={user?.profile?.name || 'User'}
                      className="w-9 h-9 rounded-full border cursor-pointer hover:shadow"
                      onClick={() => setIsProfileMenuOpen((open) => !open)}
                      tabIndex={0}
                    />
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-50">
                        <button
                          onClick={() => {
                            if (user?.profile?.email) {
                              localStorage.removeItem(`sheetId_${user.profile.email}`);
                            }
                            setUser(null);
                            setIsProfileMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                          tabIndex={0}
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
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
                  currentUserEmail={user.email}
                  currency={selectedCurrency}
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
                    currentUserEmail={user.email}
                    activeFilters={activeFilters}
                    currency={selectedCurrency}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Container */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-4 items-center z-[100]">
            {/* Menu Button and Action Buttons */}
            <div className="relative" ref={menuRef}>
              {isMenuOpen && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-10 -z-10"
                  aria-hidden="true"
                />
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`bg-white text-gray-700 p-4 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-300 border border-gray-200 ${isMenuOpen ? 'rotate-90' : ''}`}
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Action Buttons */}
              <div 
                className={`absolute bottom-full right-0 mb-4 flex flex-col gap-4 transition-all duration-300 origin-bottom-right ${
                  isMenuOpen 
                    ? 'transform scale-100 opacity-100' 
                    : 'transform scale-95 opacity-0 pointer-events-none'
                }`}
              >
                {/* Currency Selector Button */}
                <div className="relative">
                  <CurrencySelect
                    value={selectedCurrency.code}
                    onChange={handleCurrencyChange}
                    renderButton={({ selectedCurrency, onClick }) => (
                      <button
                        onClick={onClick}
                        className="bg-white text-gray-700 w-14 h-14 rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200 flex items-center justify-center"
                        aria-label="Change Currency"
                      >
                        <span className="text-lg font-medium">{selectedCurrency.symbol}</span>
                      </button>
                    )}
                  />
                </div>

                {/* Filter Button */}
                <button
                  onClick={handleFilterClick}
                  className={`w-14 h-14 rounded-full shadow-lg transition-colors flex items-center justify-center ${
                    activeFilters
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                  aria-label="Filter Transactions"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>

                {/* Add Transaction Button */}
                <button
                  onClick={handleAddTransaction}
                  className="bg-indigo-600 w-14 h-14 rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  aria-label="Add Transaction"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Popup */}
          {showFilters && (
            <FilterPopup
              onClose={() => setShowFilters(false)}
              onApplyFilters={handleApplyFilters}
              initialFilters={activeFilters}
              expenses={expenses}
            />
          )}

          {/* Add Transaction Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[200]">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
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
                    onClose={() => setShowAddForm(false)}
                    currentUserEmail={user.email}
                    expenses={expenses}
                    isSubmitting={isSubmitting}
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

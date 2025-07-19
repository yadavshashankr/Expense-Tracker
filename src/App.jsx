
import { useState, useEffect } from 'react'
import ExpenseForm from './components/ExpenseForm'
import ExpenseTable from './components/ExpenseTable'
import FilterButton from './components/FilterButton'
import FilterPopup from './components/FilterPopup'
import LoginButton from './components/LoginButton'
import TotalSection from './components/TotalSection'
import { ensureUserSheet, fetchAllRows, appendExpense, updateExpenseRow, deleteExpenseRow } from './services/sheets'
import CurrencySelect from './components/CurrencySelect'
import { CurrencyProvider, useCurrency } from './context/CurrencyContext'

function App() {
  const [user, setUser] = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      setShowAddExpense(false);
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
    setShowAddExpense(true);
  };

  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
              {user ? (
                <div className="flex items-center gap-4">
                  <CurrencySelect 
                    value={useCurrency().currency.code}
                    onChange={useCurrency().setCurrency}
                  />
                  <button
                    onClick={() => setUser(null)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <LoginButton onLogin={setUser} />
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
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

          {user && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Transaction
                  </button>
                  <FilterButton onClick={() => setShowFilters(true)} activeFilters={activeFilters} />
                </div>
                <button
                  onClick={fetchExpenses}
                  disabled={isRefreshing}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <TotalSection expenses={expenses} currentUserEmail={user.email} />

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2 text-gray-600">Loading transactions...</p>
                </div>
              ) : (
                <ExpenseTable
                  expenses={expenses}
                  onEdit={handleUpdateExpense}
                  onDelete={handleDeleteExpense}
                  currentUserEmail={user.email}
                  activeFilters={activeFilters}
                />
              )}
            </div>
          )}

          {showAddExpense && (
            <ExpenseForm
              onSubmit={handleAddExpense}
              onClose={() => setShowAddExpense(false)}
              currentUserEmail={user?.email}
              expenses={expenses}
              isSubmitting={isSubmitting}
            />
          )}

          {showFilters && (
            <FilterPopup
              onClose={() => setShowFilters(false)}
              onApplyFilters={handleApplyFilters}
              initialFilters={activeFilters}
              expenses={expenses}
            />
          )}
        </main>
      </div>
    </CurrencyProvider>
  );
}

export default App;

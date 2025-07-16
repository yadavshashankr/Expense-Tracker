
import { useEffect, useState } from 'react'
import LoginButton from './components/LoginButton'
import ExpenseForm from './components/ExpenseForm'
import ExpenseTable from './components/ExpenseTable'
import TotalSection from './components/TotalSection'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {!user ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Expense Tracker</h1>
            <LoginButton onLogin={setUser} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
              <div className="flex gap-4">
                <button
                  onClick={fetchExpenses}
                  disabled={isRefreshing}
                  className="text-gray-600 hover:text-gray-900 disabled:opacity-50 text-sm sm:text-base"
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={() => setUser(null)}
                  className="text-gray-600 hover:text-gray-900 text-sm sm:text-base"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col h-[calc(100vh-8rem)]">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4">
                  {error}
                </div>
              )}

              {/* Content */}
              {!isLoading && !error && (
                <>
                  <TotalSection expenses={expenses} />
                  <div className="mt-6 flex-1 overflow-hidden">
                    <ExpenseTable
                      expenses={expenses}
                      onEdit={handleUpdateExpense}
                      onDelete={handleDeleteExpense}
                      currentUserEmail={user?.profile.email}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* FAB for adding new expense - only show when logged in */}
      {user && (
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-10"
          aria-label="Add Transaction"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      )}

      {/* Add Form Modal - only show when logged in */}
      {user && showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Transaction</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ExpenseForm
              user={user}
              onSubmit={handleAddExpense}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App;

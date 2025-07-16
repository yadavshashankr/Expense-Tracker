
import { useState, useMemo } from 'react';

// Utility function for date formatting
const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  
  // Format date as dd-mmm-yyyy
  const dateStr = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-');

  // Format time as HH:MM:SS
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return { dateStr, timeStr };
};

// Calculate running balance up to a specific transaction
const calculateRunningBalance = (expenses, currentUserEmail, targetEmail, upToIndex) => {
  // For the first transaction, handle it directly
  if (upToIndex === 0) {
    const firstTransaction = expenses[0];
    const amount = parseFloat(firstTransaction.amount);
    
    // If it's my transaction
    if (firstTransaction.userEmail === currentUserEmail) {
      // If I owe them (debit), it should be negative
      if (firstTransaction.type === 'debit') return -amount;
      // If they owe me (credit), it should be positive
      if (firstTransaction.type === 'credit') return amount;
    } else {
      // If they owe me (credit), it should be positive
      if (firstTransaction.type === 'credit') return amount;
      // If I owe them (debit), it should be negative
      if (firstTransaction.type === 'debit') return -amount;
    }
    return 0;
  }

  // For subsequent transactions, calculate running balance
  return expenses
    .slice(0, upToIndex + 1)
    .reduce((balance, expense) => {
      if (expense.userEmail !== targetEmail && expense.userEmail !== currentUserEmail) {
        return balance;
      }

      const amount = parseFloat(expense.amount);
      
      // From logged-in user's perspective:
      if (expense.userEmail === currentUserEmail) {
        // When I owe them (debit), my balance decreases
        if (expense.type === 'debit') return balance - amount;
        // When they owe me (credit), my balance increases
        if (expense.type === 'credit') return balance + amount;
      } else {
        // When they owe me (credit), my balance increases
        if (expense.type === 'credit') return balance + amount;
        // When I owe them (debit), my balance decreases
        if (expense.type === 'debit') return balance - amount;
      }
      return balance;
    }, 0);
};

export default function ExpenseTable({ expenses, onEdit, onDelete, currentUserEmail }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Sort expenses by timestamp in descending order (newest first)
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [expenses]);

  // Calculate running balances for each transaction
  const runningBalances = useMemo(() => {
    // We need to calculate running balances on chronological order (oldest first)
    const chronologicalExpenses = [...expenses].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Calculate running balances
    const balances = chronologicalExpenses.map((expense, index) => ({
      ...expense,
      runningBalance: calculateRunningBalance(chronologicalExpenses, currentUserEmail, expense.userEmail, index)
    }));

    // Sort back to display order (newest first)
    return balances.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [expenses, currentUserEmail]);

  // Balance display component
  const BalanceDisplay = ({ balance }) => {
    const isPositive = balance >= 0;
    return (
      <div className="flex items-center gap-1">
        <span className={`${isPositive ? 'text-green-600' : 'text-red-600'} font-medium`}>
          {isPositive ? '+' : '-'}₹{Math.abs(balance).toFixed(2)}
        </span>
      </div>
    );
  };

  const startEdit = expense => {
    setEditingId(expense.id);
    setDraft(expense);
  };

  const cancel = () => {
    setEditingId(null);
    setDraft({});
  };

  const save = () => {
    onEdit(draft.rowIndex, {
      ...draft,
      amount: parseFloat(draft.amount)
    });
    setEditingId(null);
  };

  const change = field => e => {
    setDraft({ ...draft, [field]: e.target.value });
  };

  const toggleItemExpand = (id) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (!expenses?.length) {
    return (
      <div className="text-center py-8 bg-white shadow rounded-2xl">
        <p className="text-gray-500">No transactions yet. Add your first transaction above!</p>
      </div>
    );
  }

  // Mobile Card View Component
  const MobileExpenseCard = ({ expense, index }) => {
    const { dateStr, timeStr } = formatDateTime(expense.timestamp);
    const runningBalance = runningBalances[index].runningBalance;
    const isExpanded = expandedItems.has(expense.id);
    
    return (
      <div className="bg-white rounded-lg shadow p-3 space-y-2">
        <div 
          className="flex justify-between items-center min-h-[32px] cursor-pointer"
          onClick={() => toggleItemExpand(expense.id)}
        >
          {/* Name Section - Fixed width */}
          <div className="flex-shrink-0 flex items-center w-[30%]">
            <h3 className="font-medium text-gray-900 truncate">{expense.name}</h3>
          </div>
          
          {/* Amount and Balance Section - Fixed layout */}
          <div className="flex items-center flex-shrink-0 w-[70%]">
            {/* First Divider */}
            <div className="w-px h-6 bg-gray-200"></div>
            
            {/* Amount Section - Fixed width */}
            <div className="flex justify-center w-[45%]">
              <span className={`text-lg font-semibold text-center ${
                expense.type === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{parseFloat(expense.amount).toFixed(2)}
              </span>
            </div>
            
            {/* Second Divider */}
            <div className="w-px h-6 bg-gray-200"></div>
            
            {/* Balance Section - Fixed width */}
            <div className="flex items-center justify-end w-[45%] gap-2">
              <BalanceDisplay balance={runningBalance} />
              <button 
                className="text-gray-400 transition-transform duration-300 flex-shrink-0"
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div 
          className="transition-all duration-300 overflow-hidden"
          style={{ maxHeight: isExpanded ? '200px' : '0px' }}
        >
          <div className="pt-2 border-t border-gray-100 space-y-2 px-1">
            <div className="flex justify-between items-start">
              <p className="text-sm text-gray-500">{expense.userEmail}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                expense.type === 'credit' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {expense.type === 'credit' ? 'Credit' : 'Debit'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">{dateStr}</div>
              <div className="text-xs text-gray-400">{timeStr}</div>
            </div>

            {expense.description && (
              <p className="text-sm text-gray-600">{expense.description}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(expense);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(expense.rowIndex);
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Edit Form Component
  const EditForm = ({ expense }) => (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="datetime-local"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.timestamp.slice(0, 16)}
            onChange={e => setDraft({
              ...draft,
              timestamp: new Date(e.target.value).toISOString()
            })}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.name}
            onChange={change('name')}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.userEmail}
            onChange={change('userEmail')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.type}
            onChange={change('type')}
          >
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.amount}
            onChange={change('amount')}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.description}
            onChange={change('description')}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={save}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save
        </button>
        <button
          onClick={cancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Mobile List View */}
      <div className="space-y-3 md:hidden pb-4">
        {runningBalances.map((expense, index) => (
          <div key={expense.id}>
            {editingId === expense.id ? (
              <EditForm expense={expense} />
            ) : (
              <MobileExpenseCard expense={expense} index={index} />
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto bg-white shadow rounded-2xl">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-indigo-50 text-left">
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Date</th>
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Time</th>
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Name</th>
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Email</th>
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Type</th>
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Amount</th>
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Running Balance</th>
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap min-w-[200px]">Description</th>
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {runningBalances.map((expense, index) => {
              const { dateStr, timeStr } = formatDateTime(expense.timestamp);
              
              return (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 whitespace-nowrap text-sm">{dateStr}</td>
                  <td className="p-3 whitespace-nowrap text-sm">{timeStr}</td>
                  <td className="p-3 whitespace-nowrap text-sm">{expense.name}</td>
                  <td className="p-3 whitespace-nowrap text-sm">{expense.userEmail}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      expense.type === 'credit' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {expense.type === 'credit' ? 'Credit' : 'Debit'}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap text-sm">
                    <span className={expense.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      ₹{parseFloat(expense.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <BalanceDisplay balance={expense.runningBalance} />
                  </td>
                  <td className="p-3 text-sm break-words">{expense.description}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(expense)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(expense.rowIndex)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


import { useState, useMemo } from 'react';
import React from 'react'; // Added missing import for React
import CountryCodeSelect from './CountryCodeSelect';

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

export default function ExpenseTable({ expenses, onEdit, onDelete, currentUserEmail, activeFilters }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Apply filters and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = [...expenses];

    if (activeFilters) {
      filtered = filtered.filter(expense => {
        // Name filter
        if (activeFilters.name && !expense.name.toLowerCase().includes(activeFilters.name.toLowerCase())) {
          return false;
        }

        // Email filter
        if (activeFilters.email && !expense.userEmail.toLowerCase().includes(activeFilters.email.toLowerCase())) {
          return false;
        }

        // Mobile number filter
        if (activeFilters.mobileNumber) {
          const mobileFilter = activeFilters.mobileNumber.replace(/\D/g, '');
          const expenseMobile = expense.mobileNumber?.replace(/\D/g, '');
          if (!expenseMobile?.includes(mobileFilter)) {
            return false;
          }
        }

        // Country code filter
        if (activeFilters.countryCode && expense.countryCode !== activeFilters.countryCode) {
          return false;
        }

        // Amount range filter
        const amount = parseFloat(expense.amount);
        if (activeFilters.amountMin && amount < parseFloat(activeFilters.amountMin)) {
          return false;
        }
        if (activeFilters.amountMax && amount > parseFloat(activeFilters.amountMax)) {
          return false;
        }

        // Transaction type filter
        if (activeFilters.type !== 'all' && expense.type !== activeFilters.type) {
          return false;
        }

        // Date range filter
        if (activeFilters.dateFrom || activeFilters.dateTo) {
          const expenseDate = new Date(expense.timestamp);
          if (activeFilters.dateFrom) {
            const fromDate = new Date(activeFilters.dateFrom);
            if (expenseDate < fromDate) return false;
          }
          if (activeFilters.dateTo) {
            const toDate = new Date(activeFilters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of the day
            if (expenseDate > toDate) return false;
          }
        }

        // Description filter
        if (activeFilters.description && 
            !expense.description?.toLowerCase().includes(activeFilters.description.toLowerCase())) {
          return false;
        }

        return true;
      });
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [expenses, activeFilters]);

  // Calculate running balances for filtered expenses
  const runningBalances = useMemo(() => {
    // We need to calculate running balances on chronological order (oldest first)
    const chronologicalExpenses = [...filteredAndSortedExpenses].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Calculate running balances
    const balances = chronologicalExpenses.map((expense, index) => ({
      ...expense,
      runningBalance: calculateRunningBalance(chronologicalExpenses, currentUserEmail, expense.userEmail, index)
    }));

    // Filter by balance range if specified
    if (activeFilters?.balanceMin || activeFilters?.balanceMax) {
      return balances.filter(expense => {
        const balance = expense.runningBalance;
        if (activeFilters.balanceMin && balance < parseFloat(activeFilters.balanceMin)) {
          return false;
        }
        if (activeFilters.balanceMax && balance > parseFloat(activeFilters.balanceMax)) {
          return false;
        }
        return true;
      });
    }

    // Sort back to display order (newest first)
    return balances.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [filteredAndSortedExpenses, currentUserEmail, activeFilters]);

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

  const renderExpandedDetails = (expense) => {
    const { dateStr, timeStr } = formatDateTime(expense.timestamp);
    return (
      <div className="px-4 py-3 bg-gray-50 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Transaction ID:</span> {expense.id}
          </div>
          <div>
            <span className="font-medium">Timestamp:</span> {dateStr} {timeStr}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Name:</span> {expense.name}
          </div>
          <div>
            <span className="font-medium">Email:</span> {expense.userEmail}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Mobile:</span>{' '}
            {expense.mobileNumber ? (
              <span>
                {expense.countryCode ? (
                  <>
                    {/* Assuming countryData is defined elsewhere or passed as a prop */}
                    {/* <CountryCodeSelect countryCode={expense.countryCode} /> */}
                    {/* For now, just display the code */}
                    {expense.countryCode}
                  </>
                ) : ''}
                {expense.mobileNumber}
              </span>
            ) : 'Not provided'}
          </div>
          <div>
            <span className="font-medium">Description:</span>{' '}
            {expense.description || 'No description'}
          </div>
        </div>
      </div>
    );
  };

  if (!expenses?.length) {
    return (
      <div className="text-center py-8 bg-white shadow rounded-2xl">
        <p className="text-gray-500">No transactions yet. Add your first transaction above!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Balance
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredAndSortedExpenses.map((expense) => {
            const isExpanded = expandedItems.has(expense.id);
            const { dateStr } = formatDateTime(expense.timestamp);
            
            return (
              <React.Fragment key={expense.id}>
                <tr 
                  className={`hover:bg-gray-50 cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                  onClick={() => {
                    setExpandedItems(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(expense.id)) {
                        newSet.delete(expense.id);
                      } else {
                        newSet.add(expense.id);
                      }
                      return newSet;
                    });
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dateStr}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expense.type === 'debit' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {expense.type === 'debit' ? 'I Owe' : 'They Owe'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${
                      expense.runningBalance >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      ₹{Math.abs(expense.runningBalance).toFixed(2)}
                      {expense.runningBalance >= 0 ? ' (They Owe)' : ' (I Owe)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(expense.id);
                      }}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan="6" className="p-0">
                      {renderExpandedDetails(expense)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

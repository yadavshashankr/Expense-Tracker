
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

// New utility function to calculate balance with other users
const calculateUserBalance = (expenses, currentUserEmail, otherUserEmail) => {
  const relevantTransactions = expenses.filter(expense => 
    expense.email === otherUserEmail || expense.email === currentUserEmail
  );

  return relevantTransactions.reduce((balance, expense) => {
    const amount = parseFloat(expense.amount);
    // If current user received money (credit)
    if (expense.email === currentUserEmail && expense.type === 'credit') {
      return balance + amount;
    }
    // If current user paid money (debit)
    if (expense.email === currentUserEmail && expense.type === 'debit') {
      return balance - amount;
    }
    // If other user paid money (their debit is our credit)
    if (expense.email === otherUserEmail && expense.type === 'debit') {
      return balance + amount;
    }
    // If other user received money (their credit is our debit)
    if (expense.email === otherUserEmail && expense.type === 'credit') {
      return balance - amount;
    }
    return balance;
  }, 0);
};

export default function ExpenseTable({ expenses, onEdit, onDelete, currentUserEmail }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  // Calculate balances for all users
  const userBalances = useMemo(() => {
    const uniqueEmails = [...new Set(expenses.map(expense => expense.email))];
    return uniqueEmails.reduce((acc, email) => {
      if (email !== currentUserEmail) {
        acc[email] = calculateUserBalance(expenses, currentUserEmail, email);
      }
      return acc;
    }, {});
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

  if (!expenses?.length) {
    return (
      <div className="text-center py-8 bg-white shadow rounded-2xl">
        <p className="text-gray-500">No expenses yet. Add your first expense above!</p>
      </div>
    );
  }

  // Mobile Card View Component
  const MobileExpenseCard = ({ expense }) => {
    const { dateStr, timeStr } = formatDateTime(expense.timestamp);
    const balance = userBalances[expense.email] || 0;
    
    return (
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">{expense.name}</h3>
            <p className="text-sm text-gray-500">{expense.email}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            expense.type === 'credit' 
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {expense.type}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`text-lg font-semibold ${
            expense.type === 'credit' ? 'text-green-600' : 'text-red-600'
          }`}>
            ₹{parseFloat(expense.amount).toFixed(2)}
          </span>
          <div className="text-right">
            <div className="text-sm text-gray-500">{dateStr}</div>
            <div className="text-xs text-gray-400">{timeStr}</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-600">Balance:</div>
          <BalanceDisplay balance={balance} />
        </div>
        
        {expense.description && (
          <p className="text-sm text-gray-600 break-words">
            {expense.description}
          </p>
        )}
        
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => startEdit(expense)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(expense.rowIndex)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
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
            value={draft.email}
            onChange={change('email')}
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
      <div className="space-y-4 md:hidden">
        {expenses.map(expense => (
          <div key={expense.id}>
            {editingId === expense.id ? (
              <EditForm expense={expense} />
            ) : (
              <MobileExpenseCard expense={expense} />
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
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Balance</th>
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap min-w-[200px]">Description</th>
              <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map(expense => {
              const { dateStr, timeStr } = formatDateTime(expense.timestamp);
              const balance = userBalances[expense.email] || 0;
              
              return (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 whitespace-nowrap text-sm">{dateStr}</td>
                  <td className="p-3 whitespace-nowrap text-sm">{timeStr}</td>
                  <td className="p-3 whitespace-nowrap text-sm">{expense.name}</td>
                  <td className="p-3 whitespace-nowrap text-sm">{expense.email}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      expense.type === 'credit' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {expense.type}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap text-sm">
                    <span className={expense.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      ₹{parseFloat(expense.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <BalanceDisplay balance={balance} />
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

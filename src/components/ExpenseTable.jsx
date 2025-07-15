
import { useState } from 'react';

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

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

  return (
    <div className="w-full overflow-x-auto bg-white shadow rounded-2xl">
      <table className="min-w-full table-auto">
        <thead>
          <tr className="bg-indigo-50 text-left">
            <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Date</th>
            <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Name</th>
            <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Email</th>
            <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Type</th>
            <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Amount</th>
            <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap min-w-[200px]">Description</th>
            <th className="p-3 text-sm font-semibold text-gray-600 whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {expenses.map(expense => (
            <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
              {editingId === expense.id ? (
                <>
                  <td className="p-3 whitespace-nowrap">
                    <input
                      type="datetime-local"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={draft.timestamp.slice(0, 16)}
                      onChange={e => setDraft({
                        ...draft,
                        timestamp: new Date(e.target.value).toISOString()
                      })}
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={draft.name}
                      onChange={change('name')}
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <input
                      type="email"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={draft.email}
                      onChange={change('email')}
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <select
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={draft.type}
                      onChange={change('type')}
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={draft.amount}
                      onChange={change('amount')}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={draft.description}
                      onChange={change('description')}
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={save}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancel}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-3 whitespace-nowrap text-sm">
                    {new Date(expense.timestamp).toLocaleString()}
                  </td>
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
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

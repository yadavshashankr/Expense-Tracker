
import { useState } from 'react';

export default function ExpenseForm({ user, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', type: 'debit', amount: '', description: '' });
  const [error, setError] = useState(null);

  const change = k => e => setForm({ ...form, [k]: e.target.value });
  
  const submit = e => {
    e.preventDefault();
    try {
      if (!user || !user.email) {
        throw new Error('User email not available. Please try signing out and signing in again.');
      }

      const entry = { 
        id: crypto.randomUUID(), 
        timestamp: new Date().toISOString(), 
        userEmail: form.email,
        ...form,
        amount: parseFloat(form.amount)
      };

      onSubmit(entry);
      setForm({ name: '', email: '', type: 'debit', amount: '', description: '' });
      setError(null);
    } catch (err) {
      console.error('Error submitting transaction:', err);
      setError(err.message);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input 
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2" 
              placeholder="Enter name" 
              value={form.name} 
              onChange={change('name')} 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2" 
              placeholder="Enter email" 
              value={form.email} 
              onChange={change('email')} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select 
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2" 
                value={form.type} 
                onChange={change('type')}
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2" 
                placeholder="Enter amount" 
                value={form.amount} 
                onChange={change('amount')} 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input 
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2" 
              placeholder="Enter description" 
              value={form.description} 
              onChange={change('description')} 
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Add Transaction
        </button>
      </form>
    </div>
  );
}

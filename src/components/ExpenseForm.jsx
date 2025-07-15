
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
        userEmail: form.email, // Use the email from the form instead of user.email
        ...form,
        amount: parseFloat(form.amount) // Ensure amount is a number
      };

      onSubmit(entry);
      setForm({ name: '', email: '', type: 'debit', amount: '', description: '' });
      setError(null);
    } catch (err) {
      console.error('Error submitting expense:', err);
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-md">
      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <form onSubmit={submit} className="bg-white shadow rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <input 
            className="border p-2 rounded" 
            placeholder="Name" 
            value={form.name} 
            onChange={change('name')} 
            required 
          />
          <input 
            type="email"
            className="border p-2 rounded" 
            placeholder="Recipient's Email" 
            value={form.email} 
            onChange={change('email')} 
            required 
          />
          <select 
            className="border p-2 rounded" 
            value={form.type} 
            onChange={change('type')}
          >
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
          <input 
            type="number" 
            step="0.01"
            min="0"
            className="border p-2 rounded" 
            placeholder="Amount" 
            value={form.amount} 
            onChange={change('amount')} 
            required 
          />
          <input 
            className="border p-2 rounded col-span-2" 
            placeholder="Description" 
            value={form.description} 
            onChange={change('description')} 
          />
        </div>
        <button 
          type="submit"
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl transition-colors"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
}

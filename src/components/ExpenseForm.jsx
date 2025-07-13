
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
export default function ExpenseForm({ user, onSubmit }) {
  const [form, setForm] = useState({ counterparty: '', type: 'debit', amount: '', description: '' });
  const change = k => e => setForm({ ...form, [k]: e.target.value });
  const submit = e => {
    e.preventDefault();
    const entry = { id: uuidv4(), timestamp: new Date().toISOString(), userEmail: user.email, ...form };
    onSubmit(entry);
    setForm({ counterparty: '', type: 'debit', amount: '', description: '' });
  };
  return (
    <form onSubmit={submit} className="w-full max-w-md bg-white shadow rounded-2xl p-4 mb-6">
      <div className="grid grid-cols-2 gap-3">
        <input className="border p-2 rounded" placeholder="Counterparty" value={form.counterparty} onChange={change('counterparty')} required />
        <select className="border p-2 rounded" value={form.type} onChange={change('type')}><option value="debit">Debit</option><option value="credit">Credit</option></select>
        <input type="number" className="border p-2 rounded" placeholder="Amount" value={form.amount} onChange={change('amount')} required />
        <input className="border p-2 rounded col-span-2" placeholder="Description" value={form.description} onChange={change('description')} />
      </div>
      <button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl">Add Expense</button>
    </form>
  );
}

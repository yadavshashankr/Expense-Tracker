
import { useState } from 'react';
export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const startEdit = e => { setEditingId(e.id); setDraft(e); };
  const cancel = () => setEditingId(null);
  const save = () => { onEdit(draft.rowIndex, draft); setEditingId(null); };
  const change = k => e => setDraft({ ...draft, [k]: e.target.value });
  if (!expenses.length) return <p className="text-gray-500">No expenses yet.</p>;
  return (
    <div className="w-full max-w-xl overflow-x-auto">
      <table className="min-w-full bg-white shadow rounded-2xl">
        <thead><tr className="bg-indigo-100 text-left"><th className="p-2">Date</th><th className="p-2">Counterparty</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Desc</th><th className="p-2">Actions</th></tr></thead>
        <tbody>
          {expenses.map(e => (
            <tr key={e.id} className="border-t">
              {editingId === e.id ? (
                <>
                  <td className="p-2"><input type="date" value={draft.timestamp.slice(0,10)} onChange={ev=>setDraft({...draft, timestamp: ev.target.value + draft.timestamp.slice(10)})} /></td>
                  <td className="p-2"><input value={draft.counterparty} onChange={change('counterparty')} /></td>
                  <td className="p-2"><select value={draft.type} onChange={change('type')}><option value="debit">Debit</option><option value="credit">Credit</option></select></td>
                  <td className="p-2"><input type="number" value={draft.amount} onChange={change('amount')} /></td>
                  <td className="p-2"><input value={draft.description} onChange={change('description')} /></td>
                  <td className="p-2 space-x-1"><button onClick={save} className="text-green-600">Save</button><button onClick={cancel} className="text-gray-600">Cancel</button></td>
                </>
              ) : (
                <>
                  <td className="p-2 whitespace-nowrap">{new Date(e.timestamp).toLocaleDateString()}</td>
                  <td className="p-2">{e.counterparty}</td>
                  <td className="p-2 capitalize">{e.type}</td>
                  <td className="p-2">₹{e.amount}</td>
                  <td className="p-2">{e.description}</td>
                  <td className="p-2 space-x-1"><button onClick={()=>startEdit(e)} className="text-blue-600">Edit</button><button onClick={()=>onDelete(e.rowIndex)} className="text-red-600">Del</button></td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


import { useState, useEffect, useCallback } from 'react';
import LoginButton from './components/LoginButton';
import ExpenseForm from './components/ExpenseForm';
import ExpenseTable from './components/ExpenseTable';
import { ensureUserSheet, appendExpense, fetchAllRows, updateExpenseRow, deleteExpenseRow } from './services/sheets';

const APP_NAME = 'Expense-Tracker';
const POLL_INTERVAL = 10000;

export default function App() {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user || !accessToken) return;
    (async () => {
      const id = await ensureUserSheet({ appName: APP_NAME, userName: user.email.split('@')[0], accessToken });
      setSpreadsheetId(id);
    })();
  }, [user, accessToken]);

  const loadRows = useCallback(async () => {
    if (!spreadsheetId) return;
    const newRows = await fetchAllRows({ spreadsheetId, accessToken });
    setRows(newRows);
  }, [spreadsheetId, accessToken]);

  useEffect(() => {
    if (!spreadsheetId || !accessToken) return;
    loadRows();
    const t = setInterval(loadRows, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [spreadsheetId, accessToken, loadRows]);

  const handleAdd = async (entry) => {
    await appendExpense({ spreadsheetId, accessToken, entry });
    setRows(r => [...r, { ...entry, rowIndex: r.length + 2 }]);
  };

  const handleEdit = async (rowIndex, updated) => {
    await updateExpenseRow({ spreadsheetId, accessToken, rowIndex, entry: updated });
    setRows(all => all.map(r => r.rowIndex === rowIndex ? { ...updated, rowIndex } : r));
  };

  const handleDelete = async (rowIndex) => {
    await deleteExpenseRow({ spreadsheetId, accessToken, rowIndex });
    setRows(all => all.filter(r => r.rowIndex !== rowIndex));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Shared Expense Tracker</h1>
      {!user ? (
        <LoginButton onLogin={({ profile, credential }) => { setUser(profile); setAccessToken(credential); }} />
      ) : (
        <>
          <p className="mb-4 text-gray-700">Signed in as <span className="font-semibold">{user.email}</span></p>
          <ExpenseForm user={user} onSubmit={handleAdd} />
          <ExpenseTable expenses={rows} onEdit={handleEdit} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
}

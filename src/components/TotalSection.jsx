import { useMemo } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function TotalSection({ expenses, currentUserEmail }) {
  const { currency } = useCurrency();

  const totals = useMemo(() => {
    if (!expenses?.length) return { credit: 0, debit: 0, balance: 0 };

    return expenses.reduce((acc, expense) => {
      const amount = parseFloat(expense.amount);
      
      // Only count transactions where current user is involved
      if (expense.userEmail !== currentUserEmail) return acc;

      if (expense.type === 'credit') {
        acc.credit += amount;
        acc.balance += amount;
      } else if (expense.type === 'debit') {
        acc.debit += amount;
        acc.balance -= amount;
      }
      
      return acc;
    }, { credit: 0, debit: 0, balance: 0 });
  }, [expenses, currentUserEmail]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Credit</h3>
        <p className="mt-1 text-2xl font-semibold text-green-600">
          +{currency.symbol}{totals.credit.toFixed(2)}
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Debit</h3>
        <p className="mt-1 text-2xl font-semibold text-red-600">
          -{currency.symbol}{totals.debit.toFixed(2)}
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-500">Net Balance</h3>
        <p className={`mt-1 text-2xl font-semibold ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {totals.balance >= 0 ? '+' : '-'}{currency.symbol}{Math.abs(totals.balance).toFixed(2)}
        </p>
      </div>
    </div>
  );
} 
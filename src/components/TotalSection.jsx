import React, { useState } from 'react';

export default function TotalSection({ expenses, currentUserEmail, currency }) {
  const totals = expenses.reduce((acc, expense) => {
    const amount = parseFloat(expense.amount);
    if (expense.userEmail === currentUserEmail) {
      if (expense.type === 'credit') {
        acc.credit += amount;
      } else {
        acc.debit += amount;
      }
    }
    return acc;
  }, { credit: 0, debit: 0 });

  const balance = totals.credit - totals.debit;
  const isPositive = balance >= 0;

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
        <p className={`mt-1 text-2xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : '-'}{currency.symbol}{Math.abs(balance).toFixed(2)}
        </p>
      </div>
    </div>
  );
} 
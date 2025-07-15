import React from 'react';

export default function TotalSection({ expenses }) {
  const totals = expenses.reduce((acc, expense) => {
    const amount = parseFloat(expense.amount);
    if (expense.type === 'credit') {
      acc.credit += amount;
    } else {
      acc.debit += amount;
    }
    return acc;
  }, { credit: 0, debit: 0 });

  const balance = totals.credit - totals.debit;
  const isPositive = balance >= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Credit Total */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800">Total Credit</h3>
          <p className="text-2xl font-bold text-green-600">₹{totals.credit.toFixed(2)}</p>
        </div>

        {/* Debit Total */}
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800">Total Debit</h3>
          <p className="text-2xl font-bold text-red-600">₹{totals.debit.toFixed(2)}</p>
        </div>

        {/* Balance */}
        <div className={`${isPositive ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${isPositive ? 'text-blue-800' : 'text-orange-800'}`}>
              Balance
            </h3>
            <span className="flex items-center">
              {isPositive ? (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
            </span>
          </div>
          <p className={`text-2xl font-bold ${isPositive ? 'text-blue-600' : 'text-orange-600'}`}>
            ₹{Math.abs(balance).toFixed(2)}
            <span className="text-sm font-normal ml-2">
              {isPositive ? 'Leading' : 'Trailing'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
} 
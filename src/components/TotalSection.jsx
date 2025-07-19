import { useState, useEffect } from 'react';
import CurrencySelect from './CurrencySelect';

export default function TotalSection({ expenses, currentUserEmail, currency, onCurrencyChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isExpanded && !e.target.closest('.total-section')) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isExpanded]);

  return (
    <div className="total-section bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300">
      {/* Mobile View */}
      <div className="md:hidden">
        <div 
          className={`p-4 cursor-pointer ${isExpanded ? 'border-b border-gray-200' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${isPositive ? 'text-green-800' : 'text-red-800'}`}>
              Net Balance
            </h3>
            <div className="flex items-center gap-2">
              <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : '-'}{currency.symbol}{Math.abs(balance).toFixed(2)}
              </p>
              <div 
                className="text-gray-400 transition-transform duration-300"
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="transition-all duration-300 overflow-hidden"
          style={{ maxHeight: isExpanded ? '300px' : '0px' }}
        >
          <div className="p-4 space-y-4">
            {/* Currency Selector */}
            <div className="mb-4 relative" onClick={e => e.stopPropagation()}>
              <CurrencySelect
                value={currency.code}
                onChange={onCurrencyChange}
              />
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-green-800">Total Credit</h3>
                <p className="text-2xl font-bold text-green-600 text-right">
                  +{currency.symbol}{totals.credit.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-red-800">Total Debit</h3>
                <p className="text-2xl font-bold text-red-600 text-right">
                  -{currency.symbol}{totals.debit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block p-4">
        {/* Currency Selector for Desktop */}
        <div className="mb-4">
          <CurrencySelect
            value={currency.code}
            onChange={onCurrencyChange}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-green-800">Total Credit</h3>
              <p className="text-2xl font-bold text-green-600 text-right">
                +{currency.symbol}{totals.credit.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-red-800">Total Debit</h3>
              <p className="text-2xl font-bold text-red-600 text-right">
                -{currency.symbol}{totals.debit.toFixed(2)}
              </p>
            </div>
          </div>

          <div className={`${isPositive ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${isPositive ? 'text-green-800' : 'text-red-800'}`}>
                Net Balance
              </h3>
              <span className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : '-'}{currency.symbol}{Math.abs(balance).toFixed(2)}
                </p>
                {isPositive ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
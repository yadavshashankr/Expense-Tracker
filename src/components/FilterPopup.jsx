import { useState } from 'react';

export default function FilterPopup({ onClose, onApplyFilters }) {
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    amountMin: '',
    amountMax: '',
    balanceMin: '',
    balanceMax: '',
    type: 'all', // 'all', 'credit', 'debit'
    dateFrom: '',
    dateTo: '',
    description: '',
  });

  const handleChange = (field) => (e) => {
    setFilters(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleReset = () => {
    setFilters({
      name: '',
      email: '',
      amountMin: '',
      amountMax: '',
      balanceMin: '',
      balanceMax: '',
      type: 'all',
      dateFrom: '',
      dateTo: '',
      description: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Filter Transactions</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={filters.name}
                  onChange={handleChange('name')}
                  placeholder="Search by name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="text"
                  value={filters.email}
                  onChange={handleChange('email')}
                  placeholder="Search by email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="number"
                  value={filters.amountMin}
                  onChange={handleChange('amountMin')}
                  placeholder="Min amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="number"
                  value={filters.amountMax}
                  onChange={handleChange('amountMax')}
                  placeholder="Max amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Balance Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance Range</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="number"
                  value={filters.balanceMin}
                  onChange={handleChange('balanceMin')}
                  placeholder="Min balance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="number"
                  value={filters.balanceMax}
                  onChange={handleChange('balanceMax')}
                  placeholder="Max balance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <select
                value={filters.type}
                onChange={handleChange('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={handleChange('dateFrom')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={handleChange('dateTo')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={filters.description}
                onChange={handleChange('description')}
                placeholder="Search in description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Reset
            </button>
            <button
              onClick={() => onApplyFilters(filters)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
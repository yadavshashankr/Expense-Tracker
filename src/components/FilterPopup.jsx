import { useState } from 'react';
import CountryCodeSelect from './CountryCodeSelect';

export default function FilterPopup({ onApply, onClose, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    name: initialFilters.name || '',
    email: initialFilters.email || '',
    mobileNumber: initialFilters.mobileNumber || '',
    countryCode: initialFilters.countryCode || '',
    type: initialFilters.type || 'all',
    amountMin: initialFilters.amountMin || '',
    amountMax: initialFilters.amountMax || '',
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
    description: initialFilters.description || ''
  });

  const handleChange = (field) => (e) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onApply(filters);
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      email: '',
      mobileNumber: '',
      countryCode: '',
      type: 'all',
      amountMin: '',
      amountMax: '',
      dateFrom: '',
      dateTo: '',
      description: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Filter Transactions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filters.name}
                onChange={handleChange('name')}
                placeholder="Filter by name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filters.email}
                onChange={handleChange('email')}
                placeholder="Filter by email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Country Code</label>
              <CountryCodeSelect
                value={filters.countryCode}
                onChange={(code) => setFilters(prev => ({ ...prev, countryCode: code }))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filters.mobileNumber}
                onChange={handleChange('mobileNumber')}
                placeholder="Filter by mobile number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
              <select
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filters.type}
                onChange={handleChange('type')}
              >
                <option value="all">All</option>
                <option value="debit">I Owe</option>
                <option value="credit">They Owe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={filters.description}
                onChange={handleChange('description')}
                placeholder="Filter by description"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount Range</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={filters.amountMin}
                  onChange={handleChange('amountMin')}
                  placeholder="Min"
                  step="0.01"
                />
                <input
                  type="number"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={filters.amountMax}
                  onChange={handleChange('amountMax')}
                  placeholder="Max"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={filters.dateFrom}
                  onChange={handleChange('dateFrom')}
                />
                <input
                  type="date"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={filters.dateTo}
                  onChange={handleChange('dateTo')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
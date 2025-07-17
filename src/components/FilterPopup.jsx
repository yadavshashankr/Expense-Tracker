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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Filter Transactions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    value={filters.name}
                    onChange={handleChange('name')}
                    placeholder="Filter by name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="text"
                    className="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    value={filters.email}
                    onChange={handleChange('email')}
                    placeholder="Filter by email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="flex gap-3">
                  <div className="w-32">
                    <CountryCodeSelect
                      value={filters.countryCode}
                      onChange={(code) => setFilters(prev => ({ ...prev, countryCode: code }))}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      value={filters.mobileNumber}
                      onChange={handleChange('mobileNumber')}
                      placeholder="Filter by mobile number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Details Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                  <select
                    className="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    value={filters.type}
                    onChange={handleChange('type')}
                  >
                    <option value="all">All</option>
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    className="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    value={filters.description}
                    onChange={handleChange('description')}
                    placeholder="Filter by description"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    className="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    value={filters.amountMin}
                    onChange={handleChange('amountMin')}
                    placeholder="Min amount"
                    step="0.01"
                  />
                  <input
                    type="number"
                    className="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    value={filters.amountMax}
                    onChange={handleChange('amountMax')}
                    placeholder="Max amount"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    className="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    value={filters.dateFrom}
                    onChange={handleChange('dateFrom')}
                  />
                  <input
                    type="date"
                    className="w-full h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    value={filters.dateTo}
                    onChange={handleChange('dateTo')}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Clear Filters
            </button>
            <button
              onClick={handleSubmit}
              className="h-10 px-4 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
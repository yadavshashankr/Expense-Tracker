import { useState, useMemo } from 'react';
import CountryCodeSelect from './CountryCodeSelect';
import SearchableInput from './SearchableInput';

export default function FilterPopup({ onApply, onClose, initialFilters, expenses }) {
  // Ensure initialFilters is an object, even if null is passed
  const safeInitialFilters = initialFilters || {};
  
  const [filters, setFilters] = useState({
    name: safeInitialFilters.name || '',
    email: safeInitialFilters.email || '',
    mobileNumber: safeInitialFilters.mobileNumber || '',
    countryCode: safeInitialFilters.countryCode || '+91',
    type: safeInitialFilters.type || 'all',
    amountMin: safeInitialFilters.amountMin || '',
    amountMax: safeInitialFilters.amountMax || '',
    dateFrom: safeInitialFilters.dateFrom || '',
    dateTo: safeInitialFilters.dateTo || '',
    description: safeInitialFilters.description || '',
    balanceMin: safeInitialFilters.balanceMin || '',
    balanceMax: safeInitialFilters.balanceMax || ''
  });

  const [searchTerm, setSearchTerm] = useState({ name: '', email: '', mobileNumber: '' });

  // Create normalized list of unique users from expenses
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    
    expenses?.forEach(expense => {
      // Extract country code and mobile number from the combined field
      let countryCode = '+91';
      let mobileNumber = '';
      
      if (expense.mobileNumber) {
        // Try to extract country code and number from the combined field
        const match = expense.mobileNumber.match(/(\+\d+)(.*)/);
        if (match) {
          [, countryCode, mobileNumber] = match;
          mobileNumber = mobileNumber.trim();
        } else {
          // If no country code found, treat the whole thing as a number
          mobileNumber = expense.mobileNumber;
        }
      }

      const key = expense.userEmail;
      const existing = userMap.get(key);
      
      if (!existing || new Date(expense.timestamp) > new Date(existing.lastUsed)) {
        userMap.set(key, {
          name: expense.name,
          email: expense.userEmail,
          mobileNumber: mobileNumber,
          countryCode: countryCode,
          lastUsed: expense.timestamp,
          // Store the original combined mobile number for reference
          originalMobileNumber: expense.mobileNumber
        });
      }
    });
    
    return Array.from(userMap.values())
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
  }, [expenses]);

  // Search function
  const searchUsers = (term, field) => {
    if (!term.trim()) return [];
    
    const searchTerm = term.toLowerCase().trim();
    return uniqueUsers
      .filter(user => {
        if (field === 'name') {
          return user.name?.toLowerCase().includes(searchTerm);
        } else if (field === 'email') {
          return user.email?.toLowerCase().includes(searchTerm);
        } else if (field === 'mobileNumber') {
          // Search in both split and original formats
          const searchNumber = searchTerm.replace(/\D/g, '');
          const userNumber = user.originalMobileNumber?.replace(/\D/g, '') || '';
          const splitNumber = (user.countryCode + user.mobileNumber).replace(/\D/g, '');
          return userNumber.includes(searchNumber) || splitNumber.includes(searchNumber);
        }
        return false;
      })
      .slice(0, 5); // Show up to 5 results
  };

  const handleSearch = (field) => (value) => {
    setSearchTerm(prev => ({ ...prev, [field]: value }));
  };

  const handleSelect = (result) => {
    const { field, ...userData } = result;
    setFilters(prev => ({
      ...prev,
      name: userData.name || prev.name,
      email: userData.email || prev.email,
      // If we have the original mobile number, use it to extract parts
      ...(userData.originalMobileNumber ? {
        mobileNumber: userData.mobileNumber || '',
        countryCode: userData.countryCode || '+91'
      } : {
        mobileNumber: userData.mobileNumber || prev.mobileNumber,
        countryCode: userData.countryCode || prev.countryCode
      })
    }));
    setSearchTerm(prev => ({ ...prev, [field]: '' }));
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onApply(filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      name: '',
      email: '',
      mobileNumber: '',
      countryCode: '+91',
      type: 'all',
      amountMin: '',
      amountMax: '',
      dateFrom: '',
      dateTo: '',
      description: '',
      balanceMin: '',
      balanceMax: ''
    };
    setFilters(emptyFilters);
    onApply(emptyFilters);
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
                  <SearchableInput
                    hideLabel
                    value={filters.name}
                    onChange={handleChange('name')}
                    onSearch={handleSearch('name')}
                    searchResults={searchUsers(searchTerm.name, 'name')}
                    onSelect={(result) => handleSelect({ ...result, field: 'name' })}
                    displayField="name"
                    className="h-10"
                    placeholder="Filter by name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <SearchableInput
                    hideLabel
                    type="email"
                    value={filters.email}
                    onChange={handleChange('email')}
                    onSearch={handleSearch('email')}
                    searchResults={searchUsers(searchTerm.email, 'email')}
                    onSelect={(result) => handleSelect({ ...result, field: 'email' })}
                    displayField="email"
                    className="h-10"
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
                    <SearchableInput
                      hideLabel
                      type="tel"
                      value={filters.mobileNumber}
                      onChange={handleChange('mobileNumber')}
                      onSearch={handleSearch('mobileNumber')}
                      searchResults={searchUsers(searchTerm.mobileNumber, 'mobileNumber')}
                      onSelect={(result) => handleSelect({ ...result, field: 'mobileNumber' })}
                      displayField="mobileNumber"
                      placeholder="Filter by mobile number"
                      className="h-10"
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
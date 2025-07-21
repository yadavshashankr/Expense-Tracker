import { useState, useEffect, useMemo } from 'react';
import SearchableInput from './SearchableInput';
import CountryCodeSelect from './CountryCodeSelect';

const initialFilterState = {
  name: '',
  email: '',
  phone: '',
  countryCode: 'all',
  amountMin: '',
  amountMax: '',
  balanceMin: '',
  balanceMax: '',
  type: 'all',
  dateFrom: '',
  dateTo: '',
  description: '',
};

export default function FilterPopup({ onClose, onApplyFilters, initialFilters, expenses }) {
  const [filters, setFilters] = useState(initialFilterState);
  const [searchTerm, setSearchTerm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (initialFilters) {
      setFilters({
        ...initialFilterState,
        ...initialFilters
      });
    }
  }, [initialFilters]);

  // Create normalized list of unique users from expenses
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    
    expenses?.forEach(expense => {
      userMap.set(expense.userEmail, {
        name: expense.name,
        email: expense.userEmail,
        phone: String(expense.phone || ''),
        countryCode: expense.countryCode || '+91',
        lastUsed: expense.timestamp
      });
    });
    
    return Array.from(userMap.values())
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
  }, [expenses]);

  // Search function
  const searchUsers = (term, field) => {
    if (!term || typeof term !== 'string' || !term.trim()) return [];
    
    const trimmedTerm = term.trim();
    const searchTerm = trimmedTerm.toLowerCase();
    
    return uniqueUsers
      .filter(user => {
        if (!user || !user[field]) return false;
        
        if (field === 'name') {
          return user.name.toLowerCase().includes(searchTerm);
        } else if (field === 'email') {
          return user.email.toLowerCase().includes(searchTerm);
        } else if (field === 'phone') {
          const userPhone = String(user.phone || '');
          return userPhone.toLowerCase().includes(searchTerm);
        }
        return false;
      })
      .slice(0, 4); // Limit to 4 results
  };

  const handleSearch = (field) => (value) => {
    setSearchTerm(prev => ({ ...prev, [field]: value }));
  };

  const handleSelect = (result) => {
    setFilters(prev => ({
      ...prev,
      name: result.name || prev.name,
      email: result.email || prev.email,
      phone: result.phone || prev.phone,
      countryCode: result.countryCode || prev.countryCode
    }));
    setSearchTerm({ name: '', email: '', phone: '' });
  };

  const handleChange = (field) => (e) => {
    if (field === 'dateFrom' || field === 'dateTo') {
      // Ensure we have a valid date string
      const dateValue = e.target.value ? e.target.value : '';
      setFilters(prev => ({
        ...prev,
        [field]: dateValue
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [field]: e.target.value
      }));
    }
  };

  const handleReset = () => {
    setFilters(initialFilterState);
    onApplyFilters(initialFilterState);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto sm:w-[95%] md:w-[85%]">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6 sticky top-0 bg-white z-10 pb-2 border-b">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Filter Transactions</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Name and Email */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <SearchableInput
                  label="Name"
                  value={filters.name}
                  onChange={(value) => setFilters(prev => ({ ...prev, name: value }))}
                  placeholder="Search by name"
                  searchResults={searchUsers(filters.name, 'name')}
                  onSearch={handleSearch('name')}
                  onSelectResult={handleSelect}
                />
              </div>
              <div>
                <SearchableInput
                  label="Email"
                  type="email"
                  value={filters.email}
                  onChange={(value) => setFilters(prev => ({ ...prev, email: value }))}
                  placeholder="Search by email"
                  searchResults={searchUsers(filters.email, 'email')}
                  onSearch={handleSearch('email')}
                  onSelectResult={handleSelect}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="flex gap-2">
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
                    value={filters.phone}
                    onChange={(value) => setFilters(prev => ({ ...prev, phone: value }))}
                    placeholder="Search by phone"
                    searchResults={searchUsers(filters.phone, 'phone')}
                    onSearch={handleSearch('phone')}
                    onSelectResult={handleSelect}
                  />
                </div>
              </div>
            </div>

            {/* Amount and Balance in one row */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={filters.amountMin}
                    onChange={handleChange('amountMin')}
                    placeholder="Min"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    value={filters.amountMax}
                    onChange={handleChange('amountMax')}
                    placeholder="Max"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Balance Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={filters.balanceMin}
                    onChange={handleChange('balanceMin')}
                    placeholder="Min"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    value={filters.balanceMax}
                    onChange={handleChange('balanceMax')}
                    placeholder="Max"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Type and Date in one row */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={filters.type}
                  onChange={handleChange('type')}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={handleChange('dateFrom')}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={handleChange('dateTo')}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
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
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons - Sticky at bottom */}
          <div className="mt-4 sm:mt-6 flex justify-end gap-3 sticky bottom-0 bg-white pt-3 border-t">
            <button
              onClick={handleReset}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Reset
            </button>
            <button
              onClick={() => onApplyFilters(filters)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
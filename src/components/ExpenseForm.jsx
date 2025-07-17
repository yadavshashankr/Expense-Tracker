
import { useState, useMemo } from 'react';
import SearchableInput from './SearchableInput';
import CountryCodeSelect from './CountryCodeSelect';

export default function ExpenseForm({ onSubmit, currentUserEmail, expenses }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    type: 'debit',
    amount: '',
    description: '',
    countryCode: '+91',
    mobileNumber: ''
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState({ name: '', email: '', mobileNumber: '' });

  // Create normalized list of unique users from expenses
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    
    expenses?.forEach(expense => {
      userMap.set(expense.userEmail, {
        name: expense.name,
        email: expense.userEmail,
        mobileNumber: expense.mobileNumber,
        countryCode: expense.countryCode,
        lastUsed: expense.timestamp
      });
    });
    
    return Array.from(userMap.values())
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
  }, [expenses]);

  // Search function
  const searchUsers = (term, field) => {
    if (!term.trim()) return [];
    
    const searchTerm = term.toLowerCase();
    return uniqueUsers
      .filter(user => {
        if (field === 'name') {
          return user.name.toLowerCase().includes(searchTerm);
        } else if (field === 'email') {
          return user.email.toLowerCase().includes(searchTerm);
        } else if (field === 'mobileNumber') {
          // Search by mobile number without country code
          return user.mobileNumber?.includes(searchTerm);
        }
        return false;
      })
      .slice(0, 4); // Limit to 4 results
  };

  const handleSearch = (field) => (value) => {
    setSearchTerm(prev => ({ ...prev, [field]: value }));
  };

  const handleSelect = (result) => {
    setForm(prev => ({
      ...prev,
      name: result.name,
      email: result.email,
      mobileNumber: result.mobileNumber || '',
      countryCode: result.countryCode || '+91'
    }));
    setSearchTerm({ name: '', email: '', mobileNumber: '' });
  };

  const change = k => e => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [k]: value }));
  };
  
  const submit = e => {
    e.preventDefault();
    try {
      if (!currentUserEmail) {
        throw new Error('User email not available. Please try signing out and signing in again.');
      }

      const entry = { 
        id: crypto.randomUUID(), 
        timestamp: new Date().toISOString(), 
        userEmail: form.email,
        ...form,
        amount: parseFloat(form.amount),
        mobileNumber: form.countryCode + form.mobileNumber // Combine country code and mobile number
      };

      onSubmit(entry);
      setForm({
        name: '',
        email: '',
        type: 'debit',
        amount: '',
        description: '',
        countryCode: '+91',
        mobileNumber: ''
      });
      setSearchTerm({ name: '', email: '', mobileNumber: '' });
      setError(null);
    } catch (err) {
      console.error('Error submitting transaction:', err);
      setError(err.message);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Add Transaction</h2>
      </div>

      {/* Content */}
      <div className="p-5">
        {error && (
          <div className="mb-5 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={submit} className="space-y-5">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <SearchableInput
                  hideLabel
                  value={form.name}
                  onChange={change('name')}
                  onSearch={handleSearch('name')}
                  searchResults={searchUsers(searchTerm.name, 'name')}
                  onSelect={handleSelect}
                  displayField="name"
                  required
                  className="h-10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <SearchableInput
                  hideLabel
                  type="email"
                  value={form.email}
                  onChange={change('email')}
                  onSearch={handleSearch('email')}
                  searchResults={searchUsers(searchTerm.email, 'email')}
                  onSelect={handleSelect}
                  displayField="email"
                  required
                  className="h-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="flex gap-3">
                <div className="w-32">
                  <CountryCodeSelect
                    value={form.countryCode}
                    onChange={(code) => setForm(prev => ({ ...prev, countryCode: code }))}
                  />
                </div>
                <div className="flex-1">
                  <SearchableInput
                    hideLabel
                    type="tel"
                    value={form.mobileNumber}
                    onChange={change('mobileNumber')}
                    onSearch={handleSearch('mobileNumber')}
                    searchResults={searchUsers(searchTerm.mobileNumber, 'mobileNumber')}
                    onSelect={handleSelect}
                    displayField="mobileNumber"
                    placeholder="Enter mobile number"
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="flex gap-3">
                <select
                  value={form.type}
                  onChange={change('type')}
                  className="h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
                <input
                  type="number"
                  value={form.amount}
                  onChange={change('amount')}
                  placeholder="Enter amount"
                  className="flex-1 h-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={change('description')}
                placeholder="Enter description"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors resize-none"
                rows="2"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="submit"
                className="h-10 px-4 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

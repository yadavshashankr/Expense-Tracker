
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
    <div className="w-full">
      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchableInput
            label="Name"
            value={form.name}
            onChange={change('name')}
            onSearch={handleSearch('name')}
            searchResults={searchUsers(searchTerm.name, 'name')}
            onSelect={handleSelect}
            displayField="name"
            required
          />
          
          <SearchableInput
            label="Email"
            type="email"
            value={form.email}
            onChange={change('email')}
            onSearch={handleSearch('email')}
            searchResults={searchUsers(searchTerm.email, 'email')}
            onSelect={handleSelect}
            displayField="email"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="w-1/3 md:w-1/4">
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
                />
              </div>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="flex gap-2">
              <select
                value={form.type}
                onChange={change('type')}
                className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="debit">I Owe</option>
                <option value="credit">They Owe</option>
              </select>
              <input
                type="number"
                value={form.amount}
                onChange={change('amount')}
                placeholder="Enter amount"
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
              />
            </div>
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
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="2"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Transaction
          </button>
        </div>
      </form>
    </div>
  );
}

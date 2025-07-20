
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
    phone: '',
    countryCode: '+91', // Keep default as India for new transactions
    transactionDate: ''
  });
  
  const maxDateTime = new Date().toISOString().slice(0, 16);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState({ name: '', email: '', phone: '' });

  // Create normalized list of unique users from expenses
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    
    expenses?.forEach(expense => {
      userMap.set(expense.userEmail, {
        name: expense.name,
        email: expense.userEmail,
        phone: expense.phone || '',
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
    
    const searchTerm = term.toLowerCase();
    return uniqueUsers
      .filter(user => {
        if (!user || !user[field]) return false;
        
        if (field === 'name') {
          return user.name.toLowerCase().includes(searchTerm);
        } else if (field === 'email') {
          return user.email.toLowerCase().includes(searchTerm);
        } else if (field === 'phone') {
          const userPhone = (user.phone || '').toString();
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
    setForm(prev => ({
      ...prev,
      name: String(result.name || prev.name || ''),
      email: String(result.email || prev.email || ''),
      phone: String(result.phone || prev.phone || ''),
      countryCode: String(result.countryCode || prev.countryCode || '+91')
    }));
    setSearchTerm({ name: '', email: '', phone: '' });
  };

  const change = k => e => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [k]: value }));
  };
  
  const submit = e => {
    e.preventDefault();
    try {
      // Ensure all string fields are actually strings
      const safeForm = {
        name: String(form.name || ''),
        email: String(form.email || ''),
        type: form.type || 'debit',
        amount: form.amount || '',
        description: String(form.description || ''),
        phone: String(form.phone || ''),
        countryCode: String(form.countryCode || '+91'),
        transactionDate: String(form.transactionDate || '')
      };

      // Validate required fields
      if (!safeForm.name.trim() || !safeForm.email.trim()) {
        throw new Error('Name and email are required.');
      }

      // Validate amount
      const amount = parseFloat(safeForm.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount greater than 0.');
      }

      // Create a single entry with validated data
      const entry = {
        id: crypto.randomUUID(),
        timestamp: safeForm.transactionDate && safeForm.transactionDate.trim() !== '' 
          ? new Date(safeForm.transactionDate).toISOString()
          : new Date().toISOString(),
        name: safeForm.name.trim(),
        userEmail: safeForm.email.trim(), // Use the email entered in the form
        type: safeForm.type,
        amount: amount,
        description: safeForm.description.trim(),
        phone: safeForm.phone.trim(),
        countryCode: safeForm.countryCode
      };

      // Submit only after all validations pass
      onSubmit(entry);

      // Reset form only after successful submission
      setForm({
        name: '',
        email: '',
        type: 'debit',
        amount: '',
        description: '',
        phone: '',
        countryCode: '+91',
        transactionDate: ''
      });
      setSearchTerm({ name: '', email: '', phone: '' });
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
        <div className="space-y-4">
          <SearchableInput
            label="Name"
            value={form.name}
            onChange={(value) => setForm(prev => ({ ...prev, name: value }))}
            placeholder="Enter name"
            required
            searchResults={searchUsers(form.name, 'name')}
            onSearch={handleSearch('name')}
            onSelectResult={handleSelect}
          />
          
          <SearchableInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => setForm(prev => ({ ...prev, email: value }))}
            placeholder="Enter email"
            required
            searchResults={searchUsers(form.email, 'email')}
            onSearch={handleSearch('email')}
            onSelectResult={handleSelect}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="flex gap-2">
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
                  value={form.phone}
                  onChange={(value) => setForm(prev => ({ ...prev, phone: value }))}
                  placeholder="Enter phone number"
                  searchResults={searchUsers(form.phone, 'phone')}
                  onSearch={handleSearch('phone')}
                  onSelectResult={handleSelect}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Previous Date</label>
            <input
              type="datetime-local"
              max={maxDateTime}
              value={form.transactionDate}
              onChange={(e) => setForm(prev => ({ ...prev, transactionDate: e.target.value }))}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select 
                className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-4 py-2" 
                value={form.type} 
                onChange={change('type')}
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-4 py-2" 
                placeholder="Enter amount" 
                value={form.amount} 
                onChange={change('amount')} 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input 
              className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-4 py-2" 
              placeholder="Enter description" 
              value={form.description} 
              onChange={change('description')} 
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Add Transaction
        </button>
      </form>
    </div>
  );
}


import { useState, useMemo } from 'react';
import React from 'react'; // Added missing import for React
import { formatAmount } from './CurrencySelect';

// Import country data for flag display
const countries = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+7', flag: '🇷🇺', name: 'Russia' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' }
];

// Function to get flag emoji for a country code
const getCountryFlag = (code) => {
  console.log('getCountryFlag called with code:', code, 'type:', typeof code);
  
  // Handle edge cases
  if (!code) {
    console.log('No code provided, returning globe');
    return '🌐';
  }
  
  // Convert to string and clean the code
  let cleanCode = code.toString().trim();
  console.log('Clean code:', cleanCode);
  
  // If it's a number (like 91), convert it to the proper format (+91)
  if (!isNaN(cleanCode) && cleanCode !== '') {
    cleanCode = '+' + cleanCode;
    console.log('Converted numeric code to:', cleanCode);
  }
  
  // Try exact match first
  const country = countries.find(c => c.code === cleanCode);
  console.log('Found country:', country);
  
  if (country) {
    return country.flag;
  }
  
  // If not found, try to find by partial match (in case there are formatting issues)
  const partialMatch = countries.find(c => cleanCode.includes(c.code) || c.code.includes(cleanCode));
  console.log('Partial match:', partialMatch);
  
  return partialMatch ? partialMatch.flag : '🌐';
};

// Function to format country code for display
const formatCountryCode = (code) => {
  if (!code) return '+91';
  
  // Convert to string and clean
  let cleanCode = code.toString().trim();
  
  // If it's a number (like 91), add the + sign
  if (!isNaN(cleanCode) && cleanCode !== '') {
    cleanCode = '+' + cleanCode;
  }
  
  // If it doesn't start with +, add it
  if (!cleanCode.startsWith('+')) {
    cleanCode = '+' + cleanCode;
  }
  
  return cleanCode;
};

// Utility function for date formatting
const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  
  // Format date as dd-mmm-yyyy
  const dateStr = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-');

  // Format time as HH:MM:SS
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return { dateStr, timeStr };
};

// Calculate running balance up to a specific transaction
const calculateRunningBalance = (expenses, currentUserEmail, targetEmail, upToIndex) => {
  // For the first transaction, handle it directly
  if (upToIndex === 0) {
    const firstTransaction = expenses[0];
    const amount = parseFloat(firstTransaction.amount);
    
    // If it's my transaction
    if (firstTransaction.userEmail === currentUserEmail) {
      // If I owe them (debit), it should be negative
      if (firstTransaction.type === 'debit') return -amount;
      // If they owe me (credit), it should be positive
      if (firstTransaction.type === 'credit') return amount;
    } else {
      // If they owe me (credit), it should be positive
      if (firstTransaction.type === 'credit') return amount;
      // If I owe them (debit), it should be negative
      if (firstTransaction.type === 'debit') return -amount;
    }
    return 0;
  }

  // For subsequent transactions, calculate running balance
  return expenses
    .slice(0, upToIndex + 1)
    .reduce((balance, expense) => {
      if (expense.userEmail !== targetEmail && expense.userEmail !== currentUserEmail) {
        return balance;
      }

      const amount = parseFloat(expense.amount);
      
      // From logged-in user's perspective:
      if (expense.userEmail === currentUserEmail) {
        // When I owe them (debit), my balance decreases
        if (expense.type === 'debit') return balance - amount;
        // When they owe me (credit), my balance increases
        if (expense.type === 'credit') return balance + amount;
      } else {
        // When they owe me (credit), my balance increases
        if (expense.type === 'credit') return balance + amount;
        // When I owe them (debit), my balance decreases
        if (expense.type === 'debit') return balance - amount;
      }
      return balance;
    }, 0);
};

export default function ExpenseTable({ expenses, onEdit, onDelete, currentUserEmail, activeFilters, currency }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Apply filters and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = [...expenses];

    if (activeFilters) {
      filtered = filtered.filter(expense => {
        // Name filter
        if (activeFilters.name && !String(expense.name || '').toLowerCase().includes(activeFilters.name.toLowerCase())) {
          return false;
        }

        // Email filter
        if (activeFilters.email && !String(expense.userEmail || '').toLowerCase().includes(activeFilters.email.toLowerCase())) {
          return false;
        }

        // Phone filter
        if (activeFilters.phone) {
          // Ensure phone is a string and handle null/undefined values
          const expensePhone = String(expense.phone || '');
          if (!expensePhone.toLowerCase().includes(activeFilters.phone.toLowerCase())) {
            return false;
          }
        }

        // Country code filter
        if (activeFilters.countryCode && activeFilters.countryCode !== 'all') {
          // Normalize country codes for comparison
          let expenseCountryCode = String(expense.countryCode || '+91').trim();
          const filterCountryCode = String(activeFilters.countryCode).trim();
          
          // Handle different formats: "91" vs "+91", "1" vs "+1"
          // If expense code doesn't start with +, add it
          if (!expenseCountryCode.startsWith('+')) {
            expenseCountryCode = '+' + expenseCountryCode;
          }
          
          console.log(`Country code filter: expense="${expenseCountryCode}" vs filter="${filterCountryCode}"`);
          
          if (expenseCountryCode !== filterCountryCode) {
            return false;
          }
        }

        // Amount range filter
        const amount = parseFloat(expense.amount);
        if (activeFilters.amountMin && !isNaN(parseFloat(activeFilters.amountMin)) && amount < parseFloat(activeFilters.amountMin)) {
          return false;
        }
        if (activeFilters.amountMax && !isNaN(parseFloat(activeFilters.amountMax)) && amount > parseFloat(activeFilters.amountMax)) {
          return false;
        }

        // Transaction type filter
        if (activeFilters.type !== 'all' && expense.type !== activeFilters.type) {
          return false;
        }

        // Date range filter
        if (activeFilters.dateFrom || activeFilters.dateTo) {
          const expenseDate = new Date(expense.timestamp);
          if (activeFilters.dateFrom) {
            const fromDate = new Date(activeFilters.dateFrom);
            fromDate.setHours(0, 0, 0, 0); // Start of the day
            if (expenseDate < fromDate) return false;
          }
          if (activeFilters.dateTo) {
            const toDate = new Date(activeFilters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of the day
            if (expenseDate > toDate) return false;
          }
        }

        // Description filter
        if (activeFilters.description && !String(expense.description || '').toLowerCase().includes(activeFilters.description.toLowerCase())) {
          return false;
        }

        return true;
      });
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [expenses, activeFilters]);

  // Calculate running balances for filtered expenses
  const runningBalances = useMemo(() => {
    // We need to calculate running balances on chronological order (oldest first)
    const chronologicalExpenses = [...filteredAndSortedExpenses].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Calculate running balances
    const balances = chronologicalExpenses.map((expense, index) => {
      const runningBalance = calculateRunningBalance(chronologicalExpenses, currentUserEmail, expense.userEmail, index);
      console.log(`Calculated balance for ${expense.name}: ${runningBalance}`);
      return {
        ...expense,
        runningBalance: runningBalance
      };
    });

    // Filter by balance range if specified
    if (activeFilters?.balanceMin || activeFilters?.balanceMax) {
      console.log('Balance filter active:', { 
        balanceMin: activeFilters.balanceMin, 
        balanceMax: activeFilters.balanceMax,
        totalBalances: balances.length 
      });
      
      return balances.filter(expense => {
        const balance = expense.runningBalance;
        console.log(`Balance filter: expense balance=${balance}, min=${activeFilters.balanceMin}, max=${activeFilters.balanceMax}`);
        
        if (activeFilters.balanceMin && balance < parseFloat(activeFilters.balanceMin)) {
          console.log(`Filtered out: balance ${balance} < min ${activeFilters.balanceMin}`);
          return false;
        }
        if (activeFilters.balanceMax && balance > parseFloat(activeFilters.balanceMax)) {
          console.log(`Filtered out: balance ${balance} > max ${activeFilters.balanceMax}`);
          return false;
        }
        return true;
      });
    }

    // Sort back to display order (newest first)
    return balances.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [filteredAndSortedExpenses, currentUserEmail, activeFilters]);

  // Memoize font size calculations to prevent recalculation during scroll
  const fontSizes = useMemo(() => {
    const sizes = new Map();
    
    const getResponsiveFontClass = (amount) => {
      const formattedAmount = formatAmount(Math.abs(amount), currency);
      // Use consistent font size for all amounts
      return 'text-[12px] md:text-sm';
    };

    runningBalances.forEach(expense => {
      sizes.set(`amount-${expense.id}`, getResponsiveFontClass(expense.amount));
      sizes.set(`balance-${expense.id}`, getResponsiveFontClass(expense.runningBalance));
    });

    return sizes;
  }, [expenses, currency, currentUserEmail, runningBalances]); // Include runningBalances in dependencies

  // Balance display component
  const BalanceDisplay = ({ balance }) => {
    const isPositive = balance >= 0;
    return (
      <div className="flex items-center gap-1">
        <span className={`${isPositive ? 'text-green-600' : 'text-red-600'} font-medium`}>
          {isPositive ? '+' : '-'}{currency.symbol}{formatAmount(balance, currency)}
        </span>
      </div>
    );
  };

  const startEdit = expense => {
    setEditingId(expense.id);
    setDraft(expense);
  };

  const cancel = () => {
    setEditingId(null);
    setDraft({});
  };

  const save = () => {
    onEdit(draft.rowIndex, {
      ...draft,
      amount: parseFloat(draft.amount)
    });
    setEditingId(null);
  };

  const change = field => e => {
    setDraft({ ...draft, [field]: e.target.value });
  };

  const toggleItemExpand = (id) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Mobile Card View Component
  const MobileExpenseCard = ({ expense, index }) => {
    const { dateStr, timeStr } = formatDateTime(expense.timestamp);
    const runningBalance = runningBalances[index].runningBalance;
    const isExpanded = expandedItems.has(expense.id);

    // Calculate font sizes based on amount length
    const getResponsiveFontClass = (amount) => {
      const formattedAmount = formatAmount(Math.abs(amount), currency);
      // Only reduce font size for amounts larger than 100,000
      if (formattedAmount.length > 11) {
        return 'text-[10px] md:text-sm';
      }
      return 'text-sm';
    };

    const amountFontClass = getResponsiveFontClass(expense.amount);
    const balanceFontClass = getResponsiveFontClass(runningBalance);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div 
          className="flex items-stretch min-h-[48px] cursor-pointer px-3 py-3 gap-2"
          onClick={() => toggleItemExpand(expense.id)}
        >
          {/* Name Section - Reduced width */}
          <div className="flex-shrink-0 w-[28%] flex items-center">
            <h3 className="font-medium text-gray-900 break-words">{expense.name}</h3>
          </div>
          
          {/* First Divider */}
          <div className="w-px self-stretch bg-gray-200"></div>
          
          {/* Amount and Balance Section - Combined with fixed width */}
          <div className="flex-1 flex items-center">
            {/* Amount */}
            <div className="flex-1 flex items-center justify-end">
              <span 
                className={`${expense.type === 'credit' ? 'text-green-600' : 'text-red-600'} font-medium whitespace-nowrap ${amountFontClass}`}
              >
                {expense.type === 'credit' ? '+' : '-'}{currency.symbol}{formatAmount(Math.abs(expense.amount), currency)}
              </span>
            </div>
            
            {/* Second Divider */}
            <div className="w-px self-stretch bg-gray-200 mx-2"></div>
            
            {/* Balance */}
            <div className="flex-1 flex items-center justify-end">
              <span 
                className={`${runningBalance >= 0 ? 'text-green-600' : 'text-red-600'} font-medium whitespace-nowrap ${balanceFontClass}`}
              >
                {runningBalance >= 0 ? '+' : '-'}{currency.symbol}{formatAmount(Math.abs(runningBalance), currency)}
              </span>
            </div>
          </div>

          {/* Arrow - Fixed position */}
          <div className="flex-shrink-0 flex items-center ml-2">
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-2 text-sm">
            <div className="flex justify-between items-center text-gray-600">
              <span>Type:</span>
              <span className={`font-medium ${expense.type === 'credit' ? 'text-green-600' : 'text-red-600'} capitalize`}>
                {expense.type}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Email:</span>
              <span className="font-medium text-gray-900 break-all">{expense.userEmail}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Date:</span>
              <span className="font-medium text-gray-900">{dateStr}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Time:</span>
              <span className="font-medium text-gray-900">{timeStr}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 gap-2">
              <span className="min-w-[60px]">Phone:</span>
              <div className="font-medium text-gray-900 inline-flex items-center justify-end flex-shrink-0">
                {expense.phone ? (
                  <>
                    <span className="text-lg mr-1">{getCountryFlag(expense.countryCode || '+91')}</span>
                    <span className="whitespace-nowrap">{formatCountryCode(expense.countryCode || '+91')}-{String(expense.phone || '')}</span>
                  </>
                ) : (
                  'Not provided'
                )}
              </div>
            </div>
            {expense.description && (
              <div className="flex justify-between items-center text-gray-600">
                <span>Description:</span>
                <span className="font-medium text-gray-900 text-right">{expense.description}</span>
              </div>
            )}
            {expense.userEmail === currentUserEmail && (
              <div className="flex justify-end gap-3 mt-3 pt-2 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(expense);
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this transaction?')) {
                      onDelete(expense.rowIndex);
                    }
                  }}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Mobile List Header Component
  const MobileListHeader = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-stretch min-h-[48px] cursor-pointer px-3 py-3 gap-2">
        {/* Name Section - Reduced width */}
        <div className="flex-shrink-0 w-[28%] flex items-center">
          <h3 className="font-medium text-gray-500 text-xs uppercase">Name</h3>
        </div>
        
        {/* First Divider */}
        <div className="w-px self-stretch bg-gray-200"></div>
        
        {/* Amount and Balance Section - Combined with fixed width */}
        <div className="flex-1 flex items-center">
          {/* Amount */}
          <div className="flex-1 flex items-center justify-end">
            <span className="font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Amount</span>
          </div>
          
          {/* Second Divider */}
          <div className="w-px self-stretch bg-gray-200 mx-2"></div>
          
          {/* Balance */}
          <div className="flex-1 flex items-center justify-end">
            <span className="font-medium text-gray-500 text-xs uppercase whitespace-nowrap">Balance</span>
          </div>
        </div>

        {/* Arrow - Fixed position */}
        <div className="flex-shrink-0 flex items-center ml-2">
          <svg 
            className={`w-4 h-4 text-gray-400 flex-shrink-0 invisible`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );


  // Edit Form Component
  const EditForm = ({ expense }) => (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="datetime-local"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.timestamp.slice(0, 16)}
            onChange={e => setDraft({
              ...draft,
              timestamp: new Date(e.target.value).toISOString()
            })}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.name}
            onChange={change('name')}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.userEmail}
            onChange={change('userEmail')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.type}
            onChange={change('type')}
          >
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.amount}
            onChange={change('amount')}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={draft.description}
            onChange={change('description')}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={save}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save
        </button>
        <button
          onClick={cancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  if (!expenses?.length) {
    return (
      <div className="text-center py-8 bg-white shadow rounded-2xl">
        <p className="text-gray-500">No transactions yet. Add your first transaction above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mobile List View */}
      <div className="md:hidden">
        <div className="sticky top-0 z-10">
          <MobileListHeader />
        </div>
        <div className="space-y-2 mt-2">
          {runningBalances.map((expense, index) => (
            <div key={expense.id}>
              {editingId === expense.id ? (
                <EditForm expense={expense} />
              ) : (
                <MobileExpenseCard expense={expense} index={index} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {runningBalances.map((expense) => {
              const { dateStr, timeStr } = formatDateTime(expense.timestamp);
              const isExpanded = expandedItems.has(expense.id);
              return (
                <React.Fragment key={expense.id}>
                  <tr 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleItemExpand(expense.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.userEmail}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        expense.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {expense.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={expense.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {expense.type === 'credit' ? '+' : '-'}{currency.symbol}{formatAmount(expense.amount, currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={expense.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {expense.runningBalance >= 0 ? '+' : '-'}{currency.symbol}{formatAmount(expense.runningBalance, currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-3">
                        {expense.userEmail === currentUserEmail && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(expense);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this transaction?')) {
                                  onDelete(expense.rowIndex);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        <svg 
                          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-4 py-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <span className="ml-2 text-gray-900">{dateStr}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Time:</span>
                            <span className="ml-2 text-gray-900">{timeStr}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 min-w-[60px]">Phone:</span>
                            <span className="ml-2 text-gray-900 inline-flex items-center">
                              {expense.phone ? (
                                <>
                                  <span className="text-lg mr-1">{getCountryFlag(expense.countryCode || '+91')}</span>
                                  <span className="whitespace-nowrap">{formatCountryCode(expense.countryCode || '+91')}-{String(expense.phone || '')}</span>
                                </>
                              ) : (
                                'Not provided'
                              )}
                            </span>
                          </div>
                          {expense.description && (
                            <div className="col-span-1 sm:col-span-2">
                              <span className="text-gray-500">Description:</span>
                              <span className="ml-2 text-gray-900">{expense.description}</span>
                            </div>
                          )}
                          {/* Show sender info for mirrored transactions */}
                          {(expense.senderEmail || expense.senderPhone) && (
                            <>
                              <div className="flex justify-between items-center text-gray-600">
                                <span>Sender Email:</span>
                                <span className="font-medium text-gray-900 break-all">{expense.senderEmail || 'Not provided'}</span>
                              </div>
                              <div className="flex justify-between items-center text-gray-600 gap-2">
                                <span className="min-w-[60px]">Sender Phone:</span>
                                <div className="font-medium text-gray-900 inline-flex items-center justify-end flex-shrink-0">
                                  {expense.senderPhone ? (
                                    <span className="whitespace-nowrap">{expense.senderPhone}</span>
                                  ) : (
                                    'Not provided'
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';

// Currency data with symbols and codes
const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' }
];

export default function CurrencySelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCurrency = currencies.find(c => c.code === value) || currencies[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="font-medium">{selectedCurrency.symbol} {selectedCurrency.code}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-50">
          <div className="py-1">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => {
                  onChange(currency.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-100 ${
                  currency.code === value ? 'bg-gray-50 text-indigo-600 font-medium' : 'text-gray-700'
                }`}
              >
                <span className="mr-2">{currency.symbol}</span>
                <span>{currency.code}</span>
                <span className="ml-2 text-gray-500">- {currency.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export currencies for use in other components
export { currencies }; 
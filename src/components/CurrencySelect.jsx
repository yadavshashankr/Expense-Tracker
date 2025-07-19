import { useState, useEffect, useRef } from 'react';

// Currency data with symbols and codes
export const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }
];

export default function CurrencySelect({ value, onChange, renderButton }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const selectedCurrency = currencies.find(c => c.code === value) || currencies[0];

  const filteredCurrencies = currencies.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If custom button render function is provided, use it
  if (renderButton) {
    return (
      <div className="relative" ref={dropdownRef}>
        {renderButton({
          selectedCurrency,
          onClick: () => setIsOpen(!isOpen)
        })}

        {isOpen && (
          <div 
            className="fixed inset-0 bg-transparent touch-none"
            onClick={() => setIsOpen(false)}
          />
        )}
        {isOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border rounded-lg shadow-lg z-[100]">
            <div className="flex flex-col">
              <div className="sticky top-0 bg-white border-b z-10">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search currency..."
                  className="w-full px-3 py-2 text-sm border-0 focus:ring-0 focus:outline-none"
                />
              </div>
              <div className="overflow-y-auto" style={{ height: '200px' }}>
                {filteredCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      onChange(currency);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-sm hover:bg-gray-100 ${
                      currency.code === value ? 'bg-gray-50 text-indigo-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span className="mr-2 text-lg">{currency.symbol}</span>
                    <span>{currency.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default button rendering
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium flex items-center gap-2">
          <span className="text-lg">{selectedCurrency.symbol}</span>
          <span>{selectedCurrency.code}</span>
        </span>
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
        <div 
          className="fixed inset-0 bg-transparent touch-none"
          onClick={() => setIsOpen(false)}
        />
      )}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-[100]">
          <div className="flex flex-col">
            <div className="sticky top-0 bg-white border-b z-10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search currency..."
                className="w-full px-3 py-2 text-sm border-0 focus:ring-0 focus:outline-none"
              />
            </div>
            <div className="overflow-y-auto" style={{ height: '200px' }}>
              {filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    onChange(currency);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm hover:bg-gray-100 ${
                    currency.code === value ? 'bg-gray-50 text-indigo-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span className="mr-2 text-lg">{currency.symbol}</span>
                  <span>{currency.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
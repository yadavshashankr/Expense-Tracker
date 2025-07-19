import { useState, useEffect, useRef } from 'react';

// Country data with codes and flags
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

export default function CountryCodeSelect({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find(c => c.code === value) || countries[1] // Default to India (+91)
  );
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Update selected country when value changes externally
    const country = countries.find(c => c.code === value);
    if (country) {
      setSelectedCountry(country);
    }
  }, [value]);

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

  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.includes(searchTerm)
  );

  const handleSelect = (country) => {
    setSelectedCountry(country);
    onChange(country.code);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg shadow-sm ${
          disabled 
            ? 'bg-gray-100 cursor-not-allowed' 
            : 'hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{selectedCountry.flag}</span>
          <span>{selectedCountry.code}</span>
        </span>
        {!disabled && (
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg">
          <div className="p-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search country..."
              className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100"
              >
                <span className="text-xl">{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-gray-500 ml-auto">{country.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
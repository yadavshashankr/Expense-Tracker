import { useState } from 'react';

export const countries = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+7', flag: '🇷🇺', name: 'Russia' },
];

// Alias for backward compatibility
export const countryData = countries;

export default function CountryCodeSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCountry = countries.find(c => c.code === value) || countries[0];

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 border rounded-l-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedCountry.flag}</span>
        <span className="text-sm">{selectedCountry.code}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white shadow-lg rounded-md border overflow-auto max-h-48">
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                onChange(country.code);
                setIsOpen(false);
              }}
            >
              <span>{country.flag}</span>
              <span className="text-sm">{country.name}</span>
              <span className="text-sm text-gray-500 ml-auto">{country.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 
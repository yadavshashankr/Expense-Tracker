import { useState, useEffect, useRef } from 'react';

export default function SearchableInput({
  label,
  hideLabel = false,
  value = '',
  onChange,
  type = 'text',
  placeholder,
  required,
  searchResults = [],
  onSearch,
  onSelect,
  displayField = 'name',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value || '';
    onChange(e);
    onSearch(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
          handleSelect(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle result selection
  const handleSelect = (result) => {
    if (!result) return;
    onSelect(result);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {!hideLabel && label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type={type}
        className={`w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-4 transition-colors ${className}`}
        placeholder={placeholder}
        value={value || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        required={required}
      />
      
      {/* Search Results Dropdown */}
      {isOpen && Array.isArray(searchResults) && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
          <ul className="py-1 max-h-60 overflow-auto">
            {searchResults.map((result, index) => (
              result && result[displayField] && (
                <li
                  key={result.email || index}
                  className={`px-4 py-2 cursor-pointer ${
                    index === highlightedIndex
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="font-medium">{result[displayField]}</div>
                  {result.email && <div className="text-sm text-gray-500">{result.email}</div>}
                </li>
              )
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 
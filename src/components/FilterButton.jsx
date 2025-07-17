import { useState } from 'react';
import FilterPopup from './FilterPopup';

export default function FilterButton({ onApplyFilters, activeFilters }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleApplyFilters = (filters) => {
    onApplyFilters(filters);
    setIsOpen(false);
  };

  // Count active filters
  const getActiveFilterCount = () => {
    if (!activeFilters) return 0;
    
    return Object.entries(activeFilters).reduce((count, [key, value]) => {
      if (key === 'type' && value === 'all') return count;
      if (value && value !== '') return count + 1;
      return count;
    }, 0);
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <FilterPopup
          onClose={() => setIsOpen(false)}
          onApply={handleApplyFilters}
          initialFilters={activeFilters}
        />
      )}
    </>
  );
} 
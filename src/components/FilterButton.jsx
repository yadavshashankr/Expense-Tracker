import { useState } from 'react';
import FilterPopup from './FilterPopup';

export default function FilterButton({ onApplyFilters }) {
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowFilterPopup(true)}
        className="fixed bottom-6 right-24 bg-white text-gray-700 p-4 rounded-full shadow-lg hover:bg-gray-50 transition-colors z-10 border border-gray-200"
        aria-label="Filter Transactions"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>

      {showFilterPopup && (
        <FilterPopup
          onClose={() => setShowFilterPopup(false)}
          onApplyFilters={(filters) => {
            onApplyFilters(filters);
            setShowFilterPopup(false);
          }}
        />
      )}
    </>
  );
} 
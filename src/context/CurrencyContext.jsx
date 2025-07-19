import { createContext, useContext, useState, useEffect } from 'react';
import { currencies } from '../components/CurrencySelect';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    // Try to get user's locale currency
    try {
      const userLocale = navigator.language;
      const userRegion = new Intl.Locale(userLocale).region;
      const currencyByRegion = {
        'IN': 'INR',
        'US': 'USD',
        'GB': 'GBP',
        'EU': 'EUR',
        'JP': 'JPY',
        'AU': 'AUD',
        'CA': 'CAD',
        'CH': 'CHF',
        'CN': 'CNY',
        'SG': 'SGD',
        'AE': 'AED',
        'SA': 'SAR'
      };
      const defaultCurrency = currencyByRegion[userRegion] || 'INR';
      return currencies.find(c => c.code === defaultCurrency) || currencies[0];
    } catch (error) {
      // Default to INR if locale detection fails
      return currencies[0];
    }
  });

  const setCurrency = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      setSelectedCurrency(currency);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency: selectedCurrency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
} 
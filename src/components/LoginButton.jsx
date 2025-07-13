
import { useEffect, useState } from 'react';

export default function LoginButton({ onLogin }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Function to get the exact redirect URI that matches what's registered
  const getRedirectUri = () => {
    // Use the deployed URL in production, localhost in development
    if (import.meta.env.DEV) {
      return 'http://localhost:5173/';
    }
    return 'https://yadavshashankr.github.io/Expense-Tracker/';
  };

  useEffect(() => {
    // Debug info
    const currentUri = getRedirectUri();
    setDebugInfo({
      currentUrl: window.location.href,
      redirectUri: currentUri,
      hash: window.location.hash,
      isDev: import.meta.env.DEV
    });

    // Check if we have a token in the URL (after redirect)
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get('access_token');
    const errorParam = params.get('error');
    const errorDesc = params.get('error_description');
    
    if (errorParam) {
      const errorMessage = errorDesc ? `${errorParam}: ${errorDesc}` : errorParam;
      setError(`Authentication failed: ${errorMessage}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (accessToken) {
      // Clear the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Get user profile and complete login
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => {
            throw new Error(err.error_description || err.error || `HTTP Error ${res.status}`);
          });
        }
        return res.json();
      })
      .then(profile => {
        if (profile.error) {
          throw new Error(profile.error.message || 'Failed to get user profile');
        }
        onLogin({ profile, accessToken });
      })
      .catch(err => {
        console.error('Login error:', err);
        setError(err.message || 'Failed to complete login');
      });
    }

    setIsLoading(false);
  }, [onLogin]);

  const handleLogin = () => {
    setError(null);
    const clientId = '1031633259679-di32f4288k7vdh4juuhveeahoqd0ogvt.apps.googleusercontent.com';
    const redirectUri = getRedirectUri();
    const scope = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${scope}` +
      `&include_granted_scopes=true` +
      `&access_type=offline` +
      `&prompt=consent`;

    console.log('Auth URL:', authUrl);
    console.log('Redirect URI:', redirectUri);
    window.location.href = authUrl;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleLogin}
        className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition-colors"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
        Sign in with Google
      </button>
      <div className="text-xs text-gray-500 max-w-md overflow-auto">
        <div>Using redirect URI: {debugInfo?.redirectUri}</div>
        <div>Environment: {debugInfo?.isDev ? 'Development' : 'Production'}</div>
        {error && <div>Current URL: {debugInfo?.currentUrl}</div>}
        {error && debugInfo?.hash && <div>Hash: {debugInfo?.hash}</div>}
      </div>
    </div>
  );
}

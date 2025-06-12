import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_NAME } from '../lib/constants';

const ElectronCallbackPage: React.FC = () => {
  const [status, setStatus] = useState('Processing login...');
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');

    if (code) {
      setStatus('Authentication successful! Redirecting to the app...');
      // Redirect to the custom protocol
      window.location.href = `cronus://auth?code=${encodeURIComponent(code)}`;

      // As a fallback, you might want to close the window after a delay
      // if the redirect doesn't automatically close the tab.
      setTimeout(() => {
        window.close();
      }, 3000);
    } else {
      const error = searchParams.get('error');
      setStatus(`Authentication failed. Error: ${error || 'No code provided.'}`);
    }
  }, [location]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen font-sans bg-gray-100 dark:bg-gray-900">
      <div className="p-10 bg-white rounded-lg shadow-md dark:bg-gray-800 text-center">
        <h1 className="text-2xl mb-5 font-bold text-gray-800 dark:text-white">{APP_NAME}</h1>
        <p className="text-gray-600 dark:text-gray-300">{status}</p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          You can close this window now.
        </p>
      </div>
    </div>
  );
};

export default ElectronCallbackPage;

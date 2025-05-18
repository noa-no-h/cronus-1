import { GoogleOAuthProvider } from '@react-oauth/google';
import { PostHogProvider } from 'posthog-js/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const options = {
  api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST,
};

root.render(
  <React.StrictMode>
    <PostHogProvider apiKey={process.env.REACT_APP_PUBLIC_POSTHOG_KEY ?? ''} options={options}>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID ?? ''}>
        <App />
      </GoogleOAuthProvider>
    </PostHogProvider>
  </React.StrictMode>
);

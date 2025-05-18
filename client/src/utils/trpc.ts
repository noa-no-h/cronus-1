import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../server/src';
import { refreshAccessToken } from '../lib/auth';

const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export const trpc = createTRPCReact<AppRouter>();

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// This function will be used in App.tsx to create the client
export const createTrpcClient = () =>
  trpc.createClient({
    links: [
      httpBatchLink({
        url: `${serverUrl}/trpc`,
        async headers() {
          const token = localStorage.getItem('accessToken');
          // console.log(
          //   '🔑 Using token for request:',
          //   token ? `${token.substring(0, 15)}...` : 'none'
          // );
          return {
            Authorization: token ? `Bearer ${token}` : '',
          };
        },
        fetch: async (url, options = {}) => {
          // console.log('🔍 Making request with token:', localStorage.getItem('accessToken'));
          const response = await fetch(url, options);

          // Check for 401 Unauthorized or token-related errors
          if (
            response.status === 401 ||
            (response.status === 500 &&
              (url.toString().includes('token') ||
                url.toString().includes('jwt expired') || // Add check for jwt expired
                url.toString().includes('TokenExpiredError'))) // Add check for TokenExpiredError
          ) {
            console.log(`⚠️ Received ${response.status} error - Token likely expired or invalid`);
            if (!isRefreshing) {
              console.log('🔄 Starting token refresh process');
              isRefreshing = true;
              refreshPromise = refreshAccessToken();
            } else {
              console.log('⏳ Another refresh already in progress, waiting for it to complete');
            }

            try {
              const newToken = await refreshPromise;
              console.log(
                '✅ Token refresh successful, got new token:',
                newToken ? newToken.substring(0, 15) + '...' : 'none'
              );
              console.log('🔁 Retrying original request');
              // Retry the original request with new token
              const newOptions = {
                ...options,
                headers: {
                  ...options.headers,
                  Authorization: `Bearer ${newToken}`,
                },
              };
              return fetch(url, newOptions);
            } finally {
              isRefreshing = false;
              refreshPromise = null;
            }
          }

          return response;
        },
      }),
    ],
  });

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/src/index';

// Import or define serverUrl
const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export async function refreshAccessToken() {
  console.log('🔄 refreshAccessToken called');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    console.error('❌ No refresh token available');
    throw new Error('No refresh token available');
  }

  try {
    console.log('📤 Sending refresh token request');
    // Create a proxy client that knows about your router structure
    const client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${serverUrl}/trpc`,
        }),
      ],
    });

    console.log(
      '🔍 About to call auth.refreshToken with refreshToken:',
      refreshToken.substring(0, 15) + '...'
    );
    const response = await client.auth.refreshToken.mutate({
      refreshToken,
    });

    console.log('🔑 Received new access token:', response.accessToken.substring(0, 15) + '...');

    // Store the new token in both keys for backward compatibility
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('token', response.accessToken);

    console.log('💾 Saved new tokens to localStorage');
    return response.accessToken;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    console.log('🚪 Redirecting to login page');
    window.location.href = '/login';
    throw error;
  }
}

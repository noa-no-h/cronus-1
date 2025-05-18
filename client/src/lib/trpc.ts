import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/src/index';

const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${serverUrl}/trpc`,
    }),
  ],
}); 
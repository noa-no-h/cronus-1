import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../server/src/index';
const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const trpc = createTRPCReact<AppRouter>({});

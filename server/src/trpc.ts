import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';

// Create context from Express request/response
export const createContext = (opts: trpcExpress.CreateExpressContextOptions) => {
  const { req, res } = opts;
  return {
    req,
    res,
    userAgent: req.headers['user-agent'],
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC with context
const t = initTRPC.context<Context>().create();
export const router = t.router;
export const publicProcedure = t.procedure;

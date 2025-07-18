import dotenv from 'dotenv';
dotenv.config(); // This will load .env from the current directory (server/)

import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { UserModel } from './models/user';
import { calendarRouter } from './routers/calendar';
import sitemapRouter from './routes/sitemap';
import waitlistExpressRouter from './routes/waitlist';
import { startSuggestionCronJob } from './services/cron/suggestionScheduler';
import { publicProcedure, router } from './trpc';

// Export tRPC utilities
export { publicProcedure, router };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

// Import routers
import { activeWindowEventsRouter } from './routers/activeWindowEvents';
import { authRouter } from './routers/auth';
import { categoryRouter } from './routers/categoryRouter';
import { paymentsRouter } from './routers/payments';
import { s3Router } from './routers/s3Router';
import { statisticsRouter } from './routers/statistics';
import { suggestionsRouter } from './routers/suggestions';
import { userRouter } from './routers/user';
import { waitlistRouter } from './routers/waitlist';
import { startChurnPreventionCronJob } from './services/cron/churnPreventionScheduler';

// Export types used in router signatures
export type { CheckoutSessionResponse, PortalSessionResponse } from './routers/payments';

// Create app router
export const appRouter = router({
  auth: authRouter,
  payments: paymentsRouter,
  activeWindowEvents: activeWindowEventsRouter,
  s3: s3Router,
  user: userRouter,
  category: categoryRouter,
  calendar: calendarRouter,
  suggestions: suggestionsRouter,
  waitlist: waitlistRouter,
  statistics: statisticsRouter,
});

export type AppRouter = typeof appRouter;

const app = express();

// Add security headers and CORS first
app.use((req, res, next) => {
  // Either remove this line entirely, or try a different value
  // res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  next();
});

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://whatdidyougetdonetoday.ai',
      'https://cronushq.com',
      'https://whatdidyougetdonetoday-ai-client.onrender.com',
      'https://PROJECT_SERVER_DOMAIN',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'stripe-signature'],
  })
);

// Simple webhook handler
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    // Log the event
    console.log('✅ Webhook received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;

      const user = await UserModel.findOne({ stripeCustomerId: customerId });
      if (user) {
        user.hasSubscription = true;
        await user.save();
        console.log('💳 Subscription activated for:', user.email);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const user = await UserModel.findOne({ stripeCustomerId: customerId });
      if (user) {
        user.hasSubscription = false;
        await user.save();
        console.log('❌ Subscription deactivated for:', user.email);
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('❌ Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Use the sitemap router
app.use(sitemapRouter);
app.use(waitlistExpressRouter);

// tRPC middleware
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    onError({ error, path }) {
      console.error(`Error in tRPC path ${path}:`, error);

      // Convert auth errors to 401 responses
      const isAuthError =
        error.code === 'UNAUTHORIZED' ||
        error.message?.includes('token') ||
        error.message?.includes('jwt expired') ||
        error.message?.includes('Invalid or expired token') ||
        error.name === 'TokenExpiredError' ||
        error.name === 'JsonWebTokenError' ||
        error.name === 'NotBeforeError' ||
        // Check if it's a JWT verification error
        (error.message?.includes('jwt') &&
          (error.message.includes('expired') ||
            error.message.includes('invalid') ||
            error.message.includes('malformed')));

      if (isAuthError) {
        console.log('🔒 Converting auth error to 401 status:', error.message);
        // @ts-expect-error - httpStatus is not in the type but is used by the adapter
        error.httpStatus = 401;
      }
    },
  })
);

// Custom error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[Express Error] Unhandled error on ${req.method} ${req.originalUrl}:`, err); // Log the error with context

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || (err.type === 'entity.too.large' ? 413 : 500);

  // For this private side project, send detailed errors to the client for easier debugging.
  res.status(statusCode).send({
    error: {
      message: err.message,
      stack: err.stack,
      ...err,
    },
  });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatdidyougetdonetoday';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log(`Connected to MongoDB: ${MONGODB_URI}`))
  .catch((error) => console.error('MongoDB connection error:', error));

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

startSuggestionCronJob();
startChurnPreventionCronJob();

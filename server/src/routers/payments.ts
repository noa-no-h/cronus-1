import Stripe from 'stripe';
import { z } from 'zod';
import { User as UserModel } from '../models/user';
import { publicProcedure, router } from '../trpc';
import { verifyToken } from './auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const PRICE_ID = process.env.STRIPE_PRICE_ID || '';

// Define return types for better type inference
interface CheckoutSessionResponse {
  url: string | null;
}

interface PortalSessionResponse {
  url: string;
}

export const paymentsRouter = router({
  createCheckoutSession: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }): Promise<CheckoutSessionResponse> => {
      try {
        const decoded = verifyToken(input.token);
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
          throw new Error('User not found');
        }

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: {
              userId: user.id,
            },
          });
          customerId = customer.id;
          user.stripeCustomerId = customerId;
          await user.save();
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
              price: PRICE_ID,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${process.env.CLIENT_URL}/settings?success=true`,
          cancel_url: `${process.env.CLIENT_URL}/settings?canceled=true`,
        });

        return { url: session.url };
      } catch (error) {
        console.error('Checkout session error:', error);
        throw new Error('Failed to create checkout session');
      }
    }),

  createPortalSession: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }): Promise<PortalSessionResponse> => {
      try {
        const decoded = verifyToken(input.token);
        const user = await UserModel.findById(decoded.userId);

        if (!user || !user.stripeCustomerId) {
          throw new Error('User not found or no Stripe customer ID');
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${process.env.CLIENT_URL}/settings`,
        });

        return { url: portalSession.url };
      } catch (error) {
        console.error('Portal session error:', error);
        throw new Error('Failed to create portal session');
      }
    }),

  handleWebhook: publicProcedure
    .input(
      z.object({
        signature: z.string(),
        rawBody: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const event = stripe.webhooks.constructEvent(
          input.rawBody,
          input.signature,
          process.env.STRIPE_WEBHOOK_SECRET || ''
        );

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session;
          const customerId = session.customer as string;

          const user = await UserModel.findOne({ stripeCustomerId: customerId });
          if (user) {
            user.hasSubscription = true;
            await user.save();
          }
        }

        if (event.type === 'customer.subscription.deleted') {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const user = await UserModel.findOne({ stripeCustomerId: customerId });
          if (user) {
            user.hasSubscription = false;
            await user.save();
          }
        }

        return { received: true };
      } catch (error) {
        console.error('Webhook error:', error);
        throw new Error('Webhook handler failed');
      }
    }),
});

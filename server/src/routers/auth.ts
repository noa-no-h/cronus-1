import { User } from '@shared/types';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User as UserModel } from '../models/user';
import { publicProcedure, router } from '../trpc';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export interface ExportUsageResponse {
  canExport: boolean;
  message?: string;
  currentUsage?: number;
  limit?: number;
}

// Helper function to verify token and return user ID
export function verifyToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET || 'fallback-secret') as {
      userId: string;
    };
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    // Make sure to throw a specific error that can be handled in the middleware
    const authError = new Error('Invalid or expired token');
    // @ts-ignore - Adding custom property to Error
    authError.code = 'UNAUTHORIZED';
    throw authError;
  }
}

export const authRouter = router({
  googleLogin: publicProcedure
    .input(z.object({ credential: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
          idToken: input.credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) throw new Error('No payload');

        // Find or create user
        let user = await UserModel.findOne({ googleId: payload.sub });

        if (!user) {
          user = await UserModel.create({
            email: payload.email,
            name: payload.name,
            googleId: payload.sub,
            picture: payload.picture,
          });
        }

        // Generate access token (short-lived)
        const accessToken = jwt.sign(
          { userId: user._id },
          process.env.AUTH_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );

        // Generate refresh token (long-lived)
        const refreshToken = jwt.sign(
          { userId: user._id, version: user.tokenVersion }, // add tokenVersion to user model
          process.env.REFRESH_SECRET || 'refresh-secret',
          { expiresIn: '14d' }
        );

        return {
          accessToken,
          refreshToken,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            picture: user.picture,
          } satisfies User,
        };
      } catch (error) {
        console.error('Google login error:', error);
        throw new Error('Authentication failed');
      }
    }),

  submitWaitlistForm: publicProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        jobTitle: z.string().optional(),
        companyName: z.string().optional(),
        workEmail: z.string().email(),
        useCase: z.string().optional(),
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get the user ID from the JWT token
        const token = input.token;

        if (!token) {
          throw new Error('Authentication required');
        }

        const decoded = jwt.verify(token, process.env.AUTH_SECRET || 'fallback-secret') as {
          userId: string;
        };
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
          throw new Error('User not found');
        }

        // Update the user with waitlist data
        user.waitlistData = {
          firstName: input.firstName,
          lastName: input.lastName,
          jobTitle: input.jobTitle || '',
          companyName: input.companyName || '',
          workEmail: input.workEmail,
          useCase: input.useCase || '',
          submittedAt: new Date(),
        };

        user.isWaitlisted = true;
        await user.save();

        return { success: true };
      } catch (error) {
        console.error('Waitlist form submission error:', error);
        throw new Error('Failed to submit waitlist form');
      }
    }),

  getUser: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    try {
      const decoded = verifyToken(input.token);
      const user = await UserModel.findById(decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
        hasSubscription: user.hasSubscription,
        isWaitlisted: user.isWaitlisted,
      } satisfies User;
    } catch (error) {
      console.error('Get user error:', error);
      throw error; // Use the original error to preserve code/status
    }
  }),

  checkAndIncrementExportUsage: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }): Promise<ExportUsageResponse> => {
      try {
        const decoded = verifyToken(input.token);
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
          throw new Error('User not found');
        }

        // If user has subscription, allow unlimited usage
        if (user.hasSubscription) {
          return { canExport: true };
        }

        // For free users, check usage limit
        const FREE_EXPORT_LIMIT = 4;
        if (user.exportActionUsageCount >= FREE_EXPORT_LIMIT) {
          return {
            canExport: false,
            message: "You've reached the free export limit. Upgrade to Pro for unlimited exports.",
            currentUsage: user.exportActionUsageCount,
            limit: FREE_EXPORT_LIMIT,
          };
        }

        // Increment usage count
        user.exportActionUsageCount += 1;
        await user.save();

        return {
          canExport: true,
          currentUsage: user.exportActionUsageCount,
          limit: FREE_EXPORT_LIMIT,
        };
      } catch (error) {
        console.error('Check export usage error:', error);
        throw new Error('Failed to check export usage');
      }
    }),

  // Add new refresh token endpoint
  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      try {
        console.log('auth.ts 🔑 Verifying refresh token:', input.refreshToken);

        const decoded = jwt.verify(
          input.refreshToken,
          process.env.REFRESH_SECRET || 'refresh-secret'
        ) as {
          userId: string;
          version: number;
        };

        const user = await UserModel.findById(decoded.userId);
        if (!user || user.tokenVersion !== decoded.version) {
          const error = new Error('Invalid refresh token');
          // @ts-ignore - Adding custom property to Error
          error.code = 'UNAUTHORIZED';
          throw error;
        }

        // Generate new access token
        const accessToken = jwt.sign(
          { userId: user._id },
          process.env.AUTH_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );

        return { accessToken };
      } catch (error) {
        console.error('Refresh token error:', error);
        throw error; // Use the original error to preserve code/status
      }
    }),
});

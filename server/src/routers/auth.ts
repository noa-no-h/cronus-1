import { User } from '@shared/types';
import { GetTokenOptions, OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { LoopsClient } from 'loops';
import { defaultCategoriesData } from 'shared/categories';
import { z } from 'zod';
import { safeVerifyToken, safeVerifyTokenWithVersionTracking } from '../lib/authUtils';
import { extractClientVersion, isVersionOutdated } from '../lib/versionUtils';
import { CategoryModel } from '../models/category';
import { IUser, UserModel } from '../models/user';
import { publicProcedure, router } from '../trpc';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

const checkIsEU = async (ip: string) => {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    const data = (await response.json()) as { countryCode: string };
    const euCountryCodes = [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
    ];
    return euCountryCodes.includes(data.countryCode);
  } catch (error) {
    console.error('Failed to check if user is in EU:', error);
    return false;
  }
};

const findOrCreateUserAndOnboard = async (
  payload: TokenPayload,
  userAgent?: string,
  ip?: string
): Promise<IUser> => {
  let user = await UserModel.findOne({ googleId: payload.sub });

  if (!user) {
    const isInEU = ip ? await checkIsEU(ip) : false;

    user = await UserModel.create({
      email: payload.email,
      name: payload.name,
      googleId: payload.sub,
      picture: payload.picture,
      isInEU,
      multiPurposeApps: [
        'Mail',
        'Beeper Desktop',
        'WhatsApp',
        'Notion',
        'Slack',
        'Telegram',
        'Discord',
        'Obsidian',
        'Microsoft Teams',
        'Messages',
        'Spotify',
        'Figma',
        'Superhuman',
        'Fantastical',
        'Spark',
      ],
    });

    const clientVersion = extractClientVersion(userAgent);
    if (!clientVersion || isVersionOutdated(clientVersion, '1.7.5')) {
      // We now create categories during the onboarding
      await CategoryModel.insertMany(defaultCategoriesData(user._id.toString()));
    }

    try {
      const firstName = payload.name ? payload.name.split(' ')[0] : '';
      const lastName = payload.name ? payload.name.split(' ').slice(1).join(' ') : '';

      // Send welcome email to new user
      await loops.sendTransactionalEmail({
        transactionalId: 'cmcsc5r410gblzn0juvq2vsxb',
        email: payload.email!,
        dataVariables: {
          datavariable: firstName,
        },
      });

      // Add user to Loops audience
      await loops.createContact({
        email: payload.email!,
        firstName: firstName,
        lastName: lastName,
        source: 'Cronus App Signup',
      } as any);

      // Send notification to you about new signup to arne
      await loops.sendTransactionalEmail({
        transactionalId: 'cmcywrw9709mz350i5kxqllir',
        email: 'arne.strickmann@googlemail.com',
        dataVariables: {
          userEmail: payload.email!,
          userName: payload.name || 'Unknown',
          signUpDate: new Date().toLocaleString(),
        },
      });

      // Send notification to you about new signup to moritz
      await loops.sendTransactionalEmail({
        transactionalId: 'cmcywrw9709mz350i5kxqllir',
        email: 'wallawitsch@gmail.com',
        dataVariables: {
          userEmail: payload.email!,
          userName: payload.name || 'Unknown',
          signUpDate: new Date().toLocaleString(),
        },
      });

      console.log('✅ New user added to Loops and notifications sent:', payload.email);
    } catch (error) {
      console.error('❌ Loops API error:', error);
    }
  }

  return user;
};

export interface ExportUsageResponse {
  canExport: boolean;
  message?: string;
  currentUsage?: number;
  limit?: number;
}

export const authRouter = router({
  googleLogin: publicProcedure
    .input(z.object({ credential: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
          idToken: input.credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) throw new Error('No payload');

        const user = await findOrCreateUserAndOnboard(payload, ctx.userAgent, ctx.req.ip);

        // Generate access token (short-lived)
        const accessToken = jwt.sign(
          { userId: user._id },
          process.env.AUTH_SECRET || 'fallback-secret',
          { expiresIn: '365d' }
        );

        // Generate refresh token (long-lived)
        const refreshToken = jwt.sign(
          { userId: user._id, version: user.tokenVersion }, // add tokenVersion to user model
          process.env.REFRESH_SECRET || 'refresh-secret',
          { expiresIn: '365d' }
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
        throw new Error(`Authentication failed: ${(error as Error).message}`);
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
        competitorExperience: z.string().optional(),
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
          competitorExperience: input.competitorExperience || '',
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

  getUser: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input, ctx }) => {
    try {
      const decoded = safeVerifyTokenWithVersionTracking(input.token, ctx.userAgent);
      const user = await UserModel.findById(decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Backfill isInEU for existing users who don't have it properly set
      if (!user.isInEU && ctx.req.ip) {
        try {
          const actualIsInEU = await checkIsEU(ctx.req.ip);
          if (actualIsInEU !== user.isInEU) {
            user.isInEU = actualIsInEU;
            await user.save();
          }
        } catch (error) {
          console.error(`[getUser] Failed to backfill EU status for user: ${user.email}`, error);
          // Don't throw - continue with existing isInEU value
        }
      }

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
        hasSubscription: user.hasSubscription,
        isWaitlisted: user.isWaitlisted,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        isInEU: user.isInEU,
        electronAppSettings: user.electronAppSettings,
      } satisfies User;
    } catch (error) {
      console.error(
        `[getUser] Error occurred during user lookup for token: ${input.token.substring(0, 20)}...`,
        error
      );
      throw error;
    }
  }),

  checkAndIncrementExportUsage: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }): Promise<ExportUsageResponse> => {
      const decoded = safeVerifyToken(input.token);
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
    }),

  // Add new refresh token endpoint
  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      try {
        //console.log('auth.ts 🔑 Verifying refresh token:', input.refreshToken);

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
          { expiresIn: '365d' }
        );

        return { accessToken };
      } catch (error) {
        console.error('Refresh token error:', error);
        throw error; // Use the original error to preserve code/status
      }
    }),

  markOnboardingComplete: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const decoded = safeVerifyToken(input.token);
      const user = await UserModel.findById(decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      user.hasCompletedOnboarding = true;
      await user.save();

      return { success: true };
    }),

  exchangeGoogleCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        isDesktopFlow: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log('Attempting to exchange code:', {
          code: input.code,
          isDesktopFlow: input.isDesktopFlow,
        });

        const tokenOptions: GetTokenOptions = {
          code: input.code,
        };

        if (input.isDesktopFlow) {
          const redirectUri = `${process.env.CLIENT_URL}/electron-callback`;
          console.log('Using redirect URI for desktop flow:', redirectUri);
          tokenOptions.redirect_uri = redirectUri;
        } else {
          const redirectUri = 'http://localhost:5173';
          console.log('Using redirect URI for dev popup flow:', redirectUri);
          tokenOptions.redirect_uri = redirectUri;
        }

        // Exchange code for tokens with Google
        const { tokens } = await googleClient.getToken(tokenOptions);
        console.log('Successfully got tokens from Google');

        // ✅ ADD: Check for calendar scope
        const hasCalendarScope = tokens.scope?.includes('calendar.readonly') || false;
        console.log('Calendar scope granted:', hasCalendarScope);

        const ticket = await googleClient.verifyIdToken({
          idToken: tokens.id_token!,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        console.log('Successfully verified ID token');

        const payload = ticket.getPayload();
        if (!payload) throw new Error('No payload');

        // Find or create user (reuse your existing logic)
        const user = await findOrCreateUserAndOnboard(payload, ctx.userAgent, ctx.req.ip);

        if (hasCalendarScope && tokens.access_token) {
          user.googleAccessToken = tokens.access_token;
          if (tokens.refresh_token) {
            user.googleRefreshToken = tokens.refresh_token;
          }
          user.hasCalendarAccess = true;
          await user.save();
          console.log('Stored Google Calendar tokens for user:', user.email);
        }

        // Generate tokens (reuse your existing logic)
        const accessToken = jwt.sign(
          { userId: user._id },
          process.env.AUTH_SECRET || 'fallback-secret',
          { expiresIn: '365d' }
        );
        const refreshToken = jwt.sign(
          { userId: user._id, version: user.tokenVersion },
          process.env.REFRESH_SECRET || 'refresh-secret',
          { expiresIn: '365d' }
        );

        return {
          accessToken,
          refreshToken,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            picture: user.picture,
          },
        };
      } catch (error: any) {
        console.error('Detailed error in exchangeGoogleCode:', {
          error,
          message: error?.message,
          code: error?.code,
          stack: error?.stack,
        });
        throw error;
      }
    }),
});

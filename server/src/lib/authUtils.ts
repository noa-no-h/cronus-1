import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';

// Helper function to verify token and return user ID
function verifyToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET || 'fallback-secret') as {
      userId: string;
    };
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);

    // Preserve the original JWT error information for better handling
    if (error instanceof jwt.TokenExpiredError) {
      const authError = new Error('Token has expired');
      authError.name = 'TokenExpiredError';
      // @ts-ignore - Adding custom property to Error
      authError.code = 'UNAUTHORIZED';
      throw authError;
    } else if (error instanceof jwt.JsonWebTokenError) {
      const authError = new Error('Invalid or malformed token');
      authError.name = 'JsonWebTokenError';
      // @ts-ignore - Adding custom property to Error
      authError.code = 'UNAUTHORIZED';
      throw authError;
    } else if (error instanceof jwt.NotBeforeError) {
      const authError = new Error('Token not active yet');
      authError.name = 'NotBeforeError';
      // @ts-ignore - Adding custom property to Error
      authError.code = 'UNAUTHORIZED';
      throw authError;
    } else {
      // Generic JWT error
      const authError = new Error('Invalid or expired token');
      authError.name = 'TokenError';
      // @ts-ignore - Adding custom property to Error
      authError.code = 'UNAUTHORIZED';
      throw authError;
    }
  }
}

// Helper function to safely verify token and convert errors to TRPCError
export function safeVerifyToken(token: string): { userId: string } {
  try {
    return verifyToken(token);
  } catch (error) {
    console.error('Token verification error:', error);
    // Handle token verification errors specifically
    if (
      error instanceof Error &&
      (error.message.includes('jwt') ||
        error.message.includes('token') ||
        error.message.includes('expired') ||
        error.name === 'TokenExpiredError' ||
        error.name === 'JsonWebTokenError' ||
        (error as any).code === 'UNAUTHORIZED')
    ) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token.',
      });
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication error.',
    });
  }
}

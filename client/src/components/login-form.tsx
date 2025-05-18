import { defaultPage, LINK_TO_WAITLIST } from '@/App';
import { useLocation } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { cn } from '@/lib/utils';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useCallback, useEffect } from 'react';

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const reason = searchParams.get('reason');
  const getLoginTitle = () => {
    switch (reason) {
      case 'enrichment-login-wall':
        return 'Sign-up to enrich cells for free';
      case 'add-rows-login-wall':
        return 'Sign up to Add Rows and Enrich them with data';
      case 'edit-table-login-wall':
        return 'Sign up to Edit Tables';
      default:
        return 'Welcome back';
    }
  };

  const getLoginDescription = () => {
    switch (reason) {
      case 'enrichment-login-wall':
        return 'Create an account to start enriching your data';
      case 'add-rows-login-wall':
        return 'Create an account to start adding and enriching rows';
      case 'edit-table-login-wall':
        return 'Create an account to start editing tables';
      default:
        return 'Login with your Google account';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      window.location.href = defaultPage;
    }
  }, []);

  const googleLoginMutation = trpc.auth.googleLogin.useMutation();

  const handleGoogleSuccess = useCallback(async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;

    try {
      const response = await googleLoginMutation.mutateAsync({
        credential: credentialResponse.credential,
      });

      // Store tokens with both the new and old keys
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('token', response.accessToken); // For backward compatibility

      console.log('Successfully stored tokens');

      if (LINK_TO_WAITLIST) {
        window.location.href = '/waitlist-form';
      } else {
        window.location.href = defaultPage;
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  }, []);

  return (
    <div className={cn('flex flex-col gap-6 items-center w-full', className)} {...props}>
      <Card className="w-[90%] max-w-md mx-auto sm:w-[80%] md:w-[60%] lg:w-[40%]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl">{getLoginTitle()}</CardTitle>
          <CardDescription>{getLoginDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.log('Login Failed')}
                  />
                </div>
              </div>
              <div className="text-sm text-center">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => (window.location.href = '/signup')}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign up
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By clicking continue, you agree to our <a href="/terms">Terms of Service</a> and{' '}
        <a href="/privacy">Privacy Policy</a>.
      </div>
    </div>
  );
}

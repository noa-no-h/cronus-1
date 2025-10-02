import { defaultPage, LINK_TO_WAITLIST } from '@/App';
import { useLocation } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { trpc } from '@/utils/trpc';
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

  const { data: userData } = trpc.auth.getUser.useQuery(
    { token: localStorage.getItem('accessToken') || '' },
    {
      enabled: !!localStorage.getItem('accessToken'),
    }
  );

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && userData) {
      // Admin dashboard access restriction for existing tokens
      const allowedEmails = ['wallawitsch@gmail.com', 'arne.strickmann@googlemail.com', 'noa@noanoa.space'];
      if (!allowedEmails.includes(userData.email)) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        alert('Access denied: This admin dashboard is restricted to authorized users only.');
        return;
      }
      window.location.href = defaultPage;
    }
  }, [userData]);

  const googleLoginMutation = trpc.auth.googleLogin.useMutation();

  const handleGoogleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential) return;

      try {
        const response = await googleLoginMutation.mutateAsync({
          credential: credentialResponse.credential,
        });

        // Admin dashboard access restriction
        const allowedEmails = ['wallawitsch@gmail.com', 'arne.strickmann@googlemail.com', 'noa@noanoa.space'];
        if (!allowedEmails.includes(response.user.email)) {
          alert('Access denied: This admin dashboard is restricted to authorized users only.');
          return;
        }

        // Store tokens with both the new and old keys
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);

        console.log('Successfully stored tokens');

        if (LINK_TO_WAITLIST) {
          window.location.href = '/waitlist-form';
        } else {
          window.location.href = defaultPage;
        }
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    [googleLoginMutation]
  );

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

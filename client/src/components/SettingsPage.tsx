import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { AppLayout } from './AppLayout';
import { Button } from './ui/button';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  picture?: string | null;
  hasSubscription?: boolean;
}

const LoadingSkeleton = () => (
  <AppLayout>
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Subscription Status</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>

        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </AppLayout>
);

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    isLoading: userLoading,
    data: userData,
    error: queryError,
  } = trpc.auth.getUser.useQuery(
    { token: localStorage.getItem('accessToken') || '' },
    {
      enabled: !!localStorage.getItem('accessToken'),
    }
  );

  const createCheckoutSession = trpc.payments.createCheckoutSession.useMutation();
  const createPortalSession = trpc.payments.createPortalSession.useMutation();

  React.useEffect(() => {
    if (userData) {
      setUser({
        id: userData.id || '',
        name: userData.name || '',
        email: userData.email || '',
        picture: userData.picture,
        hasSubscription: userData.hasSubscription,
      });
    }
    if (queryError) {
      setError(queryError.message);
    }
  }, [userData, queryError]);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const { url } = await createCheckoutSession.mutateAsync({
        token: localStorage.getItem('accessToken') || '',
      });
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError('Failed to create checkout session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      const { url } = await createPortalSession.mutateAsync({
        token: localStorage.getItem('accessToken') || '',
      });
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError('Failed to open subscription management');
    } finally {
      setIsLoading(false);
    }
  };

  if (userLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-4 text-red-500">Error: {error}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        {user && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {user.picture && (
                <img
                  src={user.picture}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Subscription Status</h3>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  {user.hasSubscription ? '✅ Active Subscription' : '❌ No Active Subscription'}
                </p>
                {user.hasSubscription ? (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={isLoading}
                    variant="secondary"
                  >
                    {isLoading ? 'Loading...' : 'Manage Subscription'}
                  </Button>
                ) : (
                  <Button onClick={handleSubscribe} disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Subscribe - $29/month'}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
              }}
              variant="destructive"
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SettingsPage;

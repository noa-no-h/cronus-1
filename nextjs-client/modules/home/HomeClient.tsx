'use client';

import { usePageTracking } from '~/hooks/useTracking';

export default function HomeClient({ children }: { children: React.ReactNode }) {
  usePageTracking('home');
  return <>{children}</>;
}

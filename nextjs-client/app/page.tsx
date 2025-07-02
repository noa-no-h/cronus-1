'use client';

import { Home } from '~/modules/home';
import { usePageTracking } from '~/hooks/useTracking';

export default function HomePage() {
  usePageTracking('home');
  return <Home />;
}

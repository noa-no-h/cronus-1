'use client';

import { usePageTracking } from '~/hooks/useTracking';

export default function BlogIndexClient() {
  usePageTracking('blog_index');
  return null;
}

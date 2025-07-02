'use client';

import { useBlogTracking } from '~/hooks/useTracking';

interface BlogPostClientProps {
  slug: string;
  title: string;
}

export default function BlogPostClient({ slug, title }: BlogPostClientProps) {
  useBlogTracking(slug, title);

  // This component only handles tracking, doesn't render anything
  return null;
}

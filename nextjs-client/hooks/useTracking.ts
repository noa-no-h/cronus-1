'use client';

import { useEffect } from 'react';
import { trackPageVisit, trackBlogView } from '~/lib/analytics';

export const usePageTracking = (pageName: string) => {
  useEffect(() => {
    trackPageVisit(pageName);
  }, [pageName]);
};

export const useBlogTracking = (slug: string, title: string) => {
  useEffect(() => {
    trackBlogView(slug, title);
  }, [slug, title]);
};

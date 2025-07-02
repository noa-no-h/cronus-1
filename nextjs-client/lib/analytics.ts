import posthog from 'posthog-js';

let isInitialized = false;

export const initPostHog = () => {
  if (typeof window !== 'undefined' && !isInitialized) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      // Only capture what we want
      capture_pageview: false,
      disable_session_recording: true,
      autocapture: false,
    });
    isInitialized = true;
  }
  return posthog;
};

// Track website visitors
export const trackPageVisit = (pageName: string) => {
  const posthog = initPostHog();
  posthog.capture('website_visitor', {
    source: 'nextjs_website',
    page: pageName,
  });
};

// Track blog post views
export const trackBlogView = (slug: string, title: string) => {
  const posthog = initPostHog();
  posthog.capture('blog_post_view', {
    source: 'nextjs_website',
    blog_slug: slug,
    blog_title: title,
  });
};

// Track signups
export const trackSignup = (method: string = 'unknown') => {
  const posthog = initPostHog();
  posthog.capture('website_signup', {
    source: 'nextjs_website',
    signup_method: method,
  });
};

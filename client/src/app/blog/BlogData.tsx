import { JSX } from 'react';

export interface BlogPostMetadata {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  content: JSX.Element;
}

// Notes on what to write about in the future (don't delete this)
// - the insights of hiring contributors https://philipwalton.com/articles/how-to-find-qualified-developers/
// - mention passive sourcing

export const blogPosts: BlogPostMetadata[] = [
  {
    slug: 'quick-start-guide',
    title: 'Quick Start Guide',
    description: 'Get started with our platform in minutes',
    date: '2024-05-01',
    author: 'Team',
    content: (
      <>
        <p>Hello world</p>
      </>
    ),
  },
  // {
  //   slug: 'about-deep-table',
  //   title: 'About PROJECT_NAME',
  //   description: 'Learn more about our AI-powered platform',
  //   date: '2024-05-02',
  //   author: 'Team',
  //   content: (
  //     <>
  //       <p>Hello world</p>
  //     </>
  //   ),
  // },
  // {
  //   slug: 'new-updates',
  //   title: 'New Updates',
  //   description: 'Check out the latest features and improvements',
  //   date: '2024-05-03',
  //   author: 'Team',
  //   content: (
  //     <>
  //       <p>Hello world</p>
  //     </>
  //   ),
  // },
  // {
  //   slug: 'help-center',
  //   title: 'Help Center',
  //   description: 'Find answers to common questions and issues',
  //   date: '2024-05-04',
  //   author: 'Team',
  //   content: (
  //     <>
  //       <p>Hello world</p>
  //     </>
  //   ),
  // },
  // {
  //   slug: 'free-trial-available',
  //   title: 'Free Trial Available',
  //   description: 'Try our premium features at no cost',
  //   date: '2024-05-05',
  //   author: 'Team',
  //   content: (
  //     <>
  //       <p>Hello world</p>
  //     </>
  //   ),
  // },
];

export const getBlogPostBySlug = (slug: string) => {
  return blogPosts.find((post) => post.slug === slug);
};

import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface BlogPostProps {
  title: string;
  date: string;
  author: string;
  content: React.ReactNode;
  description: string;
}

export const BlogPost: React.FC<BlogPostProps> = ({
  title,
  date,
  author,
  content,
  description,
}) => {
  return (
    <>
      <Helmet>
        <title>{title} - GitHub Developer Sourcing</title>
        <meta name="description" content={description} />
      </Helmet>
      <div className="max-w-3xl mx-auto">
        <article className="px-4 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{title}</h1>
            <div className="text-gray-600">
              <time>{date}</time> • <span>{author}</span>
            </div>
          </header>

          <div className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-a:text-blue-600">
            {content}
          </div>
        </article>
      </div>
    </>
  );
};

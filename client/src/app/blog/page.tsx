import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { blogPosts } from './posts';

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Helmet>
        <title>Blog - Your Site Name</title>
        <meta name="description" content="Read our latest blog posts and updates" />
      </Helmet>

      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      <div className="space-y-8">
        {blogPosts.map((post) => (
          <article key={post.slug} className="border-b pb-8">
            <Link to={`/blog/${post.slug}`} className="group">
              <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-600">
                {post.title}
              </h2>
              <p className="text-gray-600 mb-2">{post.description}</p>
              <div className="text-sm text-gray-500">
                <time>{post.date}</time> • <span>{post.author}</span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
} 
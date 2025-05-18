import { BlogPost } from '@/components/BlogPost';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getBlogPostBySlug } from './BlogData';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = getBlogPostBySlug(slug || '');

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <Link to="/blog">
        <Button variant="ghost" className="mt-4 mb-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>
      </Link>
      <BlogPost
        title={post.title}
        date={post.date}
        author={post.author}
        description={post.description}
        content={post.content}
      />
    </div>
  );
}

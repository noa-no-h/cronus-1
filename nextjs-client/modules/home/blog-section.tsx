import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { BlogPost } from '~/lib/blog';

export function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <article
      key={post.slug}
      className="border border-neutral-300 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
    >
      <div className="flex items-center gap-4 mb-3">
        <span className="text-sm text-primary-80">{post.category}</span>
        <span className="text-sm text-primary-80">•</span>
        <span className="text-sm text-primary-80">{post.date}</span>
        <span className="text-sm text-primary-80">•</span>
        <span className="text-sm text-primary-80">{post.readTime}</span>
      </div>
      <Link href={`/blog/${post.slug}`} className="group">
        <h2 className="text-2xl font-semibold text-primary mb-3 group-hover:text-purple-600 transition-colors">
          {post.title}
        </h2>
        <p className="text-primary-80 leading-relaxed">{post.excerpt}</p>
      </Link>
    </article>
  );
}

export function BlogSection({ posts }: { posts: BlogPost[] }) {
  const featuredPosts = posts.filter((post) => post.featured).slice(0, 3);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">Read our blog</h2>
          <p className="text-lg text-primary-80 max-w-2xl mx-auto">
            Insights on productivity, time management, and building better focus habits.
          </p>
        </div>
        <div className="grid gap-8 mb-8">
          {featuredPosts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:underline text-lg"
          >
            Read all blog posts <ArrowRightIcon className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </section>
  );
}

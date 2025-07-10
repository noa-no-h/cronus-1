import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '~/components/footer';
import { Header } from '~/components/header';
import { MarkdownRenderer } from '~/components/markdown-renderer';
import { getAllPosts, getPostBySlug } from '~/lib/blog';
import { CTASection } from '~/modules/home/cta-section';
import BlogPostClient from './BlogPostClient';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found | Cronus Blog',
    };
  }

  return {
    title: `${post.title} | Cronus Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="overflow-x-hidden">
      <BlogPostClient slug={slug} title={post.title} />
      <Header className="h-[90px] bg-white" />

      <article className="pt-[120px] pb-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link
            href="/blog"
            className="inline-flex items-center border-accent hover:underline mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm border-accent text-white px-3 py-1 rounded-full">
                {post.category}
              </span>
              <span className="text-sm text-primary-80">{post.date}</span>
              <span className="text-sm text-primary-80">•</span>
              <span className="text-sm text-primary-80">{post.readTime}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
              {post.title}
            </h1>
          </div>

          <MarkdownRenderer content={post.content || ''} />
        </div>
      </article>
      <CTASection />
      <Footer />
    </main>
  );
}

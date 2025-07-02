import { Metadata } from 'next';
import { Header } from '~/components/header';
import { Footer } from '~/components/footer';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getAllPosts } from '~/lib/blog';
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
    <main>
      <BlogPostClient slug={slug} title={post.title} />
      <Header className="h-[90px] bg-white" />

      <article className="pt-[120px] pb-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/blog"
            className="inline-flex items-center text-[#36168D] hover:underline mb-8"
          >
            ← Back to Blog
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm bg-[#36168D] text-white px-3 py-1 rounded-full">
                {post.category}
              </span>
              <span className="text-sm text-[#242437CC]">{post.date}</span>
              <span className="text-sm text-[#242437CC]">•</span>
              <span className="text-sm text-[#242437CC]">{post.readTime}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-[#242437] leading-tight">
              {post.title}
            </h1>
          </div>

          <div
            className="prose prose-lg max-w-none
              [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-[#242437] [&>h1]:mt-8 [&>h1]:mb-6
              [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-[#242437] [&>h2]:mt-8 [&>h2]:mb-4
              [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-[#242437] [&>h3]:mt-6 [&>h3]:mb-3
              [&>p]:text-[#242437CC] [&>p]:leading-relaxed [&>p]:mb-4
              [&>ul]:text-[#242437CC] [&>ul]:mb-4 [&>ul]:pl-6
              [&>li]:mb-2 [&>li]:list-disc
              [&>strong]:text-[#242437] [&>strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </div>
      </article>

      <Footer />
    </main>
  );
}

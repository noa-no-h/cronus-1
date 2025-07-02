import { Metadata } from 'next';
import { Header } from '~/components/header';
import { Footer } from '~/components/footer';
import Link from 'next/link';
import { getAllPosts } from '~/lib/blog';
import BlogIndexClient from './BlogIndexClient';

export const metadata: Metadata = {
  title: 'Blog | Cronus',
  description: 'Insights on productivity, time management, and building better habits.',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main>
      <BlogIndexClient />
      <Header className="h-[90px] bg-white" />

      <section className="pt-[120px] pb-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[#242437] mb-4">Cronus Blog</h1>
            <p className="text-xl text-[#242437CC] max-w-2xl mx-auto">
              Insights on productivity, time management, and building better focus habits.
            </p>
          </div>

          <div className="grid gap-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="border border-[#DFDFDF] rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
              >
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm bg-[#36168D] text-white px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-sm text-[#242437CC]">{post.date}</span>
                  <span className="text-sm text-[#242437CC]">•</span>
                  <span className="text-sm text-[#242437CC]">{post.readTime}</span>
                </div>

                <Link href={`/blog/${post.slug}`} className="group">
                  <h2 className="text-2xl font-semibold text-[#242437] mb-3 group-hover:text-[#36168D] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-[#242437CC] leading-relaxed">{post.excerpt}</p>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

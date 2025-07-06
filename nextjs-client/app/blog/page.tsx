import { Metadata } from 'next';
import { Footer } from '~/components/footer';
import { Header } from '~/components/header';
import { getAllPosts } from '~/lib/blog';
import { ArticleCard } from '~/modules/home/blog-section';
import BlogIndexClient from './BlogIndexClient';

export const metadata: Metadata = {
  title: 'Blog | Cronus',
  description: 'Insights on productivity, time management, and building better habits.',
};

export default function BlogPage() {
  const posts = getAllPosts();

  const featuredPosts = posts.filter((post) => post.featured);

  return (
    <main>
      <BlogIndexClient />
      <Header className="h-[90px] bg-white" />

      <section className="pt-[120px] pb-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Cronus Blog</h1>
            <p className="text-xl text-[#242437CC] max-w-2xl mx-auto">
              Insights on productivity, time management, and building better focus habits.
            </p>
          </div>

          <div className="grid gap-8">
            {featuredPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
            {posts
              .filter((post) => !post.featured)
              .map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

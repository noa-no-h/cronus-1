import { Footer } from '~/components/footer';
import { Header } from '~/components/header';
import { ComparisonSection } from './comparison-section';
import { CTASection } from './cta-section';
import { FeaturesSection } from './features-section';
import { HeroSection } from './hero-section';
// import { MarqueeSection } from './marquee-section';
import { BlogPost } from '~/lib/blog';
import { ActionSection } from './action-section';
import { BlogSection } from './blog-section';
import { ShowcaseSection } from './showcase-section';
import { TestimonialsSection } from './testimonials-section';

export function Home({ posts }: { posts: BlogPost[] }) {
  return (
    <main className="overflow-hidden">
      <Header className=" bg-gray-200" />
      <HeroSection />
      {/* <MarqueeSection /> */}
      <ShowcaseSection />
      <TestimonialsSection />
      <FeaturesSection />
      <ComparisonSection />
      <ActionSection />
      <BlogSection posts={posts} />
      <CTASection />
      <Footer />
    </main>
  );
}

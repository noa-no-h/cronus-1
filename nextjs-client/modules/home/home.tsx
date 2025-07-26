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
import { FAQSection } from './faq-section';
import SecuritySection from './security-section/page';
import { ShowcaseSection } from './showcase-section';
import { TestimonialsSection } from './testimonials-section';

export function Home({ posts }: { posts: BlogPost[] }) {
  return (
    <main className="overflow-hidden">
      <Header className=" bg-white" />
      <HeroSection />
      {/* <MarqueeSection /> */}
      <ShowcaseSection />
      <TestimonialsSection />
      <SecuritySection />
      <FeaturesSection />
      <ComparisonSection />
      <ActionSection />
      <FAQSection />
      <BlogSection posts={posts} />
      <CTASection />
      <Footer />
    </main>
  );
}

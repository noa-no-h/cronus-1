import { Footer } from '~/components/footer';
import { Header } from '~/components/header';
import { ComparisonSection } from './comparison-section';
import { CTASection } from './cta-section';
import { FeaturesSection } from './features-section';
import { HeroSection } from './hero-section';
import { MarqueeSection } from './marquee-section';
import { ShowcaseSection } from './showcase-section';
import { TestimonialsSection } from './testimonials-section';

export function Home() {
  return (
    <main className='overflow-hidden'>
      <Header className=" bg-[#ebebeb]" />
      <HeroSection />
      <MarqueeSection className="h-[140px]" />
      <ShowcaseSection />
      <TestimonialsSection />
      <FeaturesSection />
      <ComparisonSection />
      <CTASection />
      <Footer />
    </main>
  );
}

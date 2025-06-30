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
    <main>
      <Header className="h-[90px] bg-[#ebebeb]" />
      <HeroSection className="pt-[90px]" />
      <MarqueeSection className="h-[140px]" />
      <ShowcaseSection className="" />
      <TestimonialsSection className="" />
      <FeaturesSection />
      <ComparisonSection />
      <CTASection />
    </main>
  );
}

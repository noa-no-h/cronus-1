import { Footer } from '~/components/footer';
import { Header } from '~/components/header';
import { TeamsCTA } from '~/modules/teams/cta-section';
import { TeamsFeatures } from '~/modules/teams/features-section';
import { TeamsHero } from '~/modules/teams/hero-section';

export default function TeamsPage() {
  return (
    <main className="overflow-hidden">
      <Header className="bg-white" />
      <TeamsHero />
      <TeamsFeatures />
      {/* <TeamsTestimonials /> */}
      <TeamsCTA />
      <Footer />
    </main>
  );
}

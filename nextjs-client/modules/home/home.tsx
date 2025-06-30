import { Header } from '~/components/header';
import { HeroSection } from './hero-section';

export function Home() {
  return (
    <main>
      <Header className="h-[90px] bg-[#ebebeb]" />
      <HeroSection className="pt-[90px]" />
    </main>
  );
}

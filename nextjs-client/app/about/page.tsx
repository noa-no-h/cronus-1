import type { ComponentProps } from 'react';
import { Footer } from '~/components/footer';
import { Header } from '~/components/header';
import { cn } from '~/lib/cn';

const teamMembers = [
  {
    name: 'Arne Strickmann',
    bio: 'Software Engineer with experience at venture firms and fast-growing startups. Studied Software Engineering at CODE University and Computer Science at 42.',
    links: [
      { name: 'X', url: 'https://x.com/arnestrickmann' },
      { name: 'LinkedIn', url: 'https://www.linkedin.com/in/arnestrickmann/' },
      { name: 'GitHub', url: 'https://github.com/arnestrickmann' },
      { name: 'Email', url: 'mailto:arne.strickmann@googlemail.com' },
    ],
  },
  {
    name: 'Moritz Wallawitsch',
    bio: 'Founder and software engineer based in San Francisco. Co-founded RemNote (backed by General Catalyst) and BenchFlow (backed by Jeff Dean). Studied Software Engineering at CODE University of Applied Sciences. Aims to contribute to human progress by accelerating the growth of knowledge.',
    links: [
      { name: 'X', url: 'https://x.com/moritzw42' },
      { name: 'LinkedIn', url: 'https://www.linkedin.com/in/moritzw/' },
      { name: 'GitHub', url: 'https://github.com/moritzWa' },
      { name: 'Blog', url: 'https://scalingknowledge.substack.com/' },
      { name: 'Goodreads', url: 'https://goodreads.com/moritzw' },
      { name: 'Email', url: 'mailto:wallawitsch@gmail.com' },
    ],
  },
];

function TeamMemberCard({
  member,
  className,
  ...props
}: { member: (typeof teamMembers)[0] } & ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-accent/5 rounded-2xl p-8 tablet:p-12',
        'border-[0.5px] border-neutral-300',
        className
      )}
      {...props}
    >
      <h2 className="font-semibold text-2xl tablet:text-[32px] tracking-[-0.03em] text-primary mb-4">
        {member.name}
      </h2>
      <p className="text-primary text-lg tablet:text-xl leading-[1.5] mb-6">{member.bio}</p>
      <div className="flex flex-wrap gap-4">
        {member.links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center px-4 py-2',
              'bg-primary text-white rounded-md',
              'text-sm font-medium',
              'hover:bg-dark-hover transition-colors'
            )}
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="bg-white pt-16 tablet:pt-[90px]">
        <section
          className={cn(
            'bg-white text-primary',
            'py-16 tablet:py-40',
            'px-4 tablet:px-12 desktop:px-[180px]'
          )}
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="font-semibold text-3xl tablet:text-4xl desktop:text-5xl tracking-[-0.03em] text-center mb-12 tablet:mb-20">
              Our Team
            </h1>

            <div className="space-y-8 tablet:space-y-12">
              {teamMembers.map((member) => (
                <TeamMemberCard key={member.name} member={member} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

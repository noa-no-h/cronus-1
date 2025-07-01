import type { ComponentProps } from 'react';
import { Footer } from '~/components/footer';
import { Header } from '~/components/header';
import { cn } from '~/lib/cn';

const teamMembers = [
  {
    name: 'Arne Strickmann',
    bio: 'Software Engineer with experience at Thrive Capital, Highlight, Langdock, and Throne. Studied Computer Software Engineering at CODE University and Computer Science at 42 Paris.',
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
        'bg-[#faf8ff] rounded-2xl p-8 tablet:p-12',
        'border-[0.5px] border-[#dfdfdf]',
        className
      )}
      {...props}
    >
      <h2 className="font-semibold text-2xl tablet:text-[32px] tracking-[-3%] text-[#242437] mb-4">
        {member.name}
      </h2>
      <p className="text-[#242437] text-lg tablet:text-xl leading-[1.5] mb-6">{member.bio}</p>
      <div className="flex flex-wrap gap-4">
        {member.links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center px-4 py-2',
              'bg-[#242437] text-white rounded-md',
              'text-sm font-medium',
              'hover:bg-[#1a1a2e] transition-colors'
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
            'bg-white text-[#242437]',
            'py-16 tablet:py-40',
            'px-4 tablet:px-12 desktop:px-[180px]'
          )}
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="font-semibold text-3xl tablet:text-4xl desktop:text-5xl tracking-[-3%] text-center mb-12 tablet:mb-20">
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

'use client';
import AutoScroll from 'embla-carousel-auto-scroll';
import useEmblaCarousel from 'embla-carousel-react';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import { TestimonialCard } from './testimonial-card';

const testimonials = [
  {
    name: '@dev_mike',
    title: 'Frontend Developer',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    content:
      'Used to feel guilty about "wasting time" on Stack Overflow. Turns out I was actually problem-solving! Cronus gets the difference between research and rabbit holes.',
  },
  {
    name: 'Sarah Chen',
    title: 'Product Designer',
    avatar:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&crop=center',
    content:
      'Love that it tracks my iPad sketching time too. Finally, my boss can see that those "doodles" during meetings are actually ideation work!',
  },
  {
    name: '@remote_anna',
    title: 'Marketing Manager',
    avatar:
      'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=150&h=150&fit=crop&crop=center',
    content:
      'Working from home made me paranoid about productivity. Now I have actual data showing I\'m crushing it, even with those coffee breaks.',
  },
  {
    name: 'James Wilson',
    title: 'Freelance Writer',
    avatar:
      'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=150&h=150&fit=crop&crop=center',
    content:
      'Clients love the transparency. I can show them exactly how many hours went into each project, including research and revision time.',
  },
  {
    name: '@creator_sam',
    title: 'Content Creator',
    avatar:
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=150&h=150&fit=crop&crop=center',
    content:
      'The mini timer is addictive! Makes editing feel like a game. Plus I can finally answer "how long does a video take?" with real numbers.',
  },
  {
    name: 'Lisa Park',
    title: 'UX Researcher',
    avatar:
      'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=150&h=150&fit=crop&crop=center',
    content:
      'Smart enough to know when I\'m on social for user research vs mindless scrolling. No more awkward "work or procrastination?" moments.',
  },
  {
    name: '@startup_founder',
    title: 'CEO',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    content:
      'Helps me model good productivity habits for my team. Amazing how awareness alone changed my work patterns.',
  },
  {
    name: 'Alex Rodriguez',
    title: 'Data Analyst',
    avatar:
      'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=150&h=150&fit=crop&crop=center',
    content:
      'The patterns it finds are fascinating. Apparently I code best after a 10-minute Twitter break - who knew procrastination could be strategic?',
  },
];

export function TestimonialsSection({ className, ...props }: ComponentProps<'section'>) {
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
      dragFree: true,
    },
    [
      AutoScroll({
        speed: 1,
        startDelay: 1000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        playOnInit: true,
      }),
    ]
  );


  return (
    <section className={cn('bg-[#f4f4f4] py-16 tablet:py-30 desktop:py-40', className)} {...props}>
      <h3 className="font-semibold text-[#242437] text-2xl tablet:text-[32px] tracking-[-3%] text-center">
        What our users are saying
      </h3>

      <div className="mt-20 overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="flex-none w-80 tablet:w-[460px] mr-4 tablet:mr-6">
              <TestimonialCard
                name={testimonial.name}
                title={testimonial.title}
                avatar={testimonial.avatar}
                content={testimonial.content}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

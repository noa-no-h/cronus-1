'use client';
import AutoScroll from 'embla-carousel-auto-scroll';
import useEmblaCarousel from 'embla-carousel-react';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import { TestimonialCard } from './testimonial-card';

const testimonials = [
  {
    name: '@productivemaya',
    title: 'Content Creator',
    avatar:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop&crop=center',
    content:
      'This app completely changed how I track content creation! Now I can see exactly what I accomplished each day and share real progress with my audience.',
  },
  {
    name: 'Alex Chen',
    title: 'Software Engineer',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    content:
      'Perfect for documenting my coding journey. The daily reflection helps me stay motivated during tough debugging sessions.',
  },
  {
    name: '@daily_grind_emily',
    title: 'Lifestyle Influencer',
    avatar:
      'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=150&h=150&fit=crop&crop=center',
    content:
      'I love sharing my daily wins with followers! This tool makes it so easy to track everything from workouts to business goals.',
  },
  {
    name: 'David Kim',
    title: 'Freelance Designer',
    avatar:
      'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=150&h=150&fit=crop&crop=center',
    content:
      'Game-changer for client work! I can show exactly what I delivered each day, which has improved my client relationships tremendously.',
  },
  {
    name: '@techreviewsarah',
    title: 'YouTuber',
    avatar:
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=150&h=150&fit=crop&crop=center',
    content:
      'Essential for tracking my video production pipeline. From scripting to editing, I can see my progress and plan better content schedules.',
  },
  {
    name: 'Marcus Thompson',
    title: 'Startup Founder',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    content:
      'This simple tool revolutionized our team standups. Everyone comes prepared knowing exactly what they accomplished yesterday.',
  },
  {
    name: '@minimal_lisa',
    title: 'TikTok Creator',
    avatar:
      'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=150&h=150&fit=crop&crop=center',
    content:
      'Perfect for tracking my content creation goals! I can see patterns in my most productive days and optimize my posting schedule.',
  },
  {
    name: 'Jordan Rivera',
    title: 'Data Scientist',
    avatar:
      'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=150&h=150&fit=crop&crop=center',
    content:
      'The insights from tracking daily achievements are incredible. It feels like having analytics for my personal productivity.',
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

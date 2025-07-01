'use client';
import AutoScroll from 'embla-carousel-auto-scroll';
import useEmblaCarousel from 'embla-carousel-react';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import { TestimonialCard } from './testimonial-card';

const testimonials = [
  {
    name: 'Sarah Chen',
    title: 'Product Manager',
    avatar:
      'https://images.unsplash.com/photo-1494790108755-2616b612b732?w=150&h=150&fit=crop&crop=face',
    content:
      'This app transformed my daily productivity. I finally have a clear view of what I accomplish each day and it keeps me motivated.',
  },
  {
    name: 'Alex Rodriguez',
    title: 'Software Developer',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    content:
      'The daily reflection feature is incredible. It helps me celebrate small wins and stay focused on what really matters.',
  },
  {
    name: 'Emily Johnson',
    title: 'Marketing Director',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    content:
      "I love how simple yet powerful this tool is. It's become an essential part of my evening routine to track my progress.",
  },
  {
    name: 'David Kim',
    title: 'Freelance Designer',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    content:
      "As a freelancer, this app helps me stay accountable and shows clients exactly what I've accomplished each day.",
  },
  {
    name: 'Maria Santos',
    title: 'Project Coordinator',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    content:
      'The weekly summaries give me such a sense of accomplishment. I can see patterns in my productivity and improve over time.',
  },
  {
    name: 'Michael Brown',
    title: 'Startup Founder',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    content:
      "This simple tool has become crucial for my team's standups. Everyone knows exactly what they achieved yesterday.",
  },
  {
    name: 'Lisa Wang',
    title: 'UX Researcher',
    avatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    content:
      'I was skeptical at first, but tracking daily achievements has genuinely improved my work satisfaction and motivation.',
  },
  {
    name: 'James Wilson',
    title: 'Data Analyst',
    avatar:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face',
    content:
      "The insights from my daily logs help me understand my productivity patterns. It's like having a personal coach.",
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
        stopOnInteraction: true,
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

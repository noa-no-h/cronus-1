'use client';
import AutoScroll from 'embla-carousel-auto-scroll';
import useEmblaCarousel from 'embla-carousel-react';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import leander from './leander-maerkisch.png';
import moritz from './moritz-wallawitsch.jpeg';
import savannah from './savannah-feder.jpeg';
import { TestimonialCard } from './testimonial-card';

const testimonials = [
  {
    name: 'Leander Märkisch',
    title: 'Founder of Floy',
    avatar: leander,
    content:
      'I used Rize for a while but found it overwhelming and slow. Tried out Cronus and instantly fell in love with the simplicity and speed. That’s how productivity tracking should feel like.',
  },
  {
    name: 'Savannah Feder',
    title: 'Founder of Astral AI',
    avatar: savannah,
    content:
      "HUGE fan so far! Funnily enough, I had a 'holy shit, this product is going to be in my life for a long time' moment when I saw everything I'd done laid out in the calendar view.",
  },
  {
    name: 'Moritz Wallawitsch',
    title: 'Founder of Cronus, ex. RemNote',
    avatar: moritz,
    content:
      "I'm biased because I co-created this but before it took me like about 2h every week to answer two important questions: 1. How many hours did I work this week? and 2. How many hours was I distracted/on social media etc. this week? Cronus automates that.",
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
      <h3 className="font-medium font-serif text-primary text-2xl tablet:text-3xl tracking-tight text-center">
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

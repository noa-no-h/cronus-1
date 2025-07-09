'use client';
import AutoScroll from 'embla-carousel-auto-scroll';
import useEmblaCarousel from 'embla-carousel-react';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import leander from './leander-maerkisch.png';
import moritz from './moritz-wallawitsch.jpeg';
import savannah from './savannah-feder.jpeg';
import simon from './simon-berens.jpg';
import freddy from './freddy-feldmeier.png';
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
      'It used to take me ~2 hours each week to figure out: 1) how many hours I worked, and 2) how much time I was distracted/on social media. Cronus automates it and makes it 10x more accurate.',
  },
  {
    name: 'Simon Berens',
    title: 'Founder of Brighter',
    avatar: simon,
    content:
      'Cronus showed me exactly how much time I wasted on Hacker News and other distractions. It’s also great for tracking work vs. learning.',
  },
  {
    name: 'Frederik Feldmeier',
    title: 'Software Engineer',
    avatar: freddy,
    content:
      'Cronus has completely transformed how I manage my time by automatically tracking my work and distractions with impressive accuracy - really helped me getting more done.',
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

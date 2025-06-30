import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import { TestimonialCard } from './testimonial-card';

export function TestimonialsSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('bg-[#f4f4f4] py-[160px]', className)} {...props}>
      <h3 className="font-semibold text-[#242437] text-[32px] tracking-[-3%] text-center">
        What our users are saying
      </h3>

      <ul className="mt-20">
        <li>
          <TestimonialCard
            name="John Doe"
            title="Software Engineer"
            avatar="https://via.placeholder.com/150"
            content="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos."
          />
        </li>
      </ul>
    </section>
  );
}

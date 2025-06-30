import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';

export function FeaturesSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('bg-[#f4f4f4]', className)} {...props}>
      FeaturesSection
    </section>
  );
}

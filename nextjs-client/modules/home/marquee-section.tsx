import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';

// TODO
export function MarqueeSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('bg-[#f4f4f4]', className)} {...props}>
      {/* MarqueeSection */}
    </section>
  );
}

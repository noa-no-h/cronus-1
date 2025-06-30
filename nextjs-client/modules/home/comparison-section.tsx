import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';

export function ComparisonSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('bg-[#f4f4f4]', className)} {...props}>
      <h3>Cronus vs others</h3>

      <div className="rounded-2xl border-[0.5px] border-[#dfdfdf]">
        <div className="w-[464px] bg-[#faf8ff]"></div>
        <div></div>
      </div>
    </section>
  );
}

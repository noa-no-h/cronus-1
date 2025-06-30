import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';

export function Footer({ className, ...props }: ComponentProps<'footer'>) {
  return (
    <footer
      className={cn(
        'bg-[#f4f4f4] text-[#242437]',
        'flex items-center gap-[100px]',
        'pt-10 pb-20',
        className
      )}
      {...props}
    >
      <div></div>

      <div>
        <div className="space-y-[15px] text-[#242437CC]">
          <h5 className="text-[#24243766] font-semibold leading-[28px]">PRODUCT</h5>
          <Link href={'/pricing'}>Pricing</Link>
          <Link href={'/docs'}>Docs</Link>
        </div>
      </div>
    </footer>
  );
}

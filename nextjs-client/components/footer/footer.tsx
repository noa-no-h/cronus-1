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

      <div className="flex gap-[100px] text-[#242437CC] text-sm">
        <div className="space-y-[15px] flex flex-col">
          <h5 className="text-[#24243766] font-semibold leading-[28px]">PRODUCT</h5>
          <Link href={'/pricing'}>Pricing</Link>
          <Link href={'/docs'}>Docs</Link>
        </div>

        <div className="space-y-[15px] flex flex-col">
          <h5 className="text-[#24243766] font-semibold leading-[28px]">RESOURCES</h5>
          <Link href={'/audit-report'}>Audit Report</Link>
          <Link href={'/changelog'}>Changelog</Link>
          <Link href={'/blog'}>Blog</Link>
          <Link href={'/faqs'}>FAQS</Link>
          <Link href={'/press-kit'}>Press Kit</Link>
        </div>

        <div className="space-y-[15px] flex flex-col">
          <h5 className="text-[#24243766] font-semibold leading-[28px]">COMPANY</h5>
          <Link href={'/about'}>About us</Link>
          <Link href={'/privacy'}>Privacy Policy</Link>
          <Link href={'/contact'}>Contact us</Link>
          <Link href={'/blog'}>Blog</Link>
        </div>
      </div>
    </footer>
  );
}

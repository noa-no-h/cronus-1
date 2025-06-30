import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import { Discord } from '../icons/discord';
import { GitHub } from '../icons/github';
import { XformerlyTwitter } from '../icons/x';
import { YouTube } from '../icons/youtube';
import { TextLogo } from '../logo';

export function Footer({ className, ...props }: ComponentProps<'footer'>) {
  return (
    <footer
      className={cn(
        'bg-[#f4f4f4] text-[#242437]',
        'flex justify-center items-center gap-[100px]',
        'pt-10 pb-20',
        className
      )}
      {...props}
    >
      <div className="w-120">
        <div>
          <TextLogo className="w-[114px] text-[#36168D]" />
        </div>
        <p className="text-[#242437CC] text-sm mt-3">AI-Powered, Efficiency Revolution</p>

        <div className="flex gap-6 mt-12 text-[#242437]">
          <Link href={'#'}>
            <GitHub className="size-5" />
          </Link>
          <Link href={'#'}>
            <YouTube className="size-5" />
          </Link>
          <Link href={'#'}>
            <XformerlyTwitter className="size-4" />
          </Link>
          <Link href={'#'}>
            <Discord className="size-5" />
          </Link>
        </div>

        <div className="mt-12">Cronus © {new Date().getFullYear()}</div>
      </div>

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

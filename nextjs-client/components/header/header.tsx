import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import { Logo, TextLogo } from '../logo';
import { Navbar } from '../navbar/navbar';
import Link from 'next/link';
import { Menu } from '../icons/menu';

export function Header({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 bg-white',
        'flex items-center justify-between',
        'px-4 tablet:px-12',
        'h-16 tablet:h-[90px]',
        className
      )}
      {...props}
    >
      <div className='w-full flex items-center justify-between'>
        <div className="flex items-center gap-2">
          <Logo className="w-[29px]" />
          <TextLogo className="w-[114px] text-[#36168D]" />
        </div>
        <Menu className='tablet:hidden size-6'/>
      </div>
      <div className="hidden tablet:flex items-center gap-4">
        <Navbar />
        <Link
          href="https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-arm64.dmg"
          target="_blank"
          className="py-2.5 px-6 bg-[#242437] rounded-md font-semibold text-sm text-white"
        >
          Download Cronus
        </Link>
      </div>
    </header>
  );
}

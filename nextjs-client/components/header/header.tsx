'use client';
import { useState, type ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import { Logo, TextLogo } from '../logo';
import { Navbar } from '../navbar/navbar';
import Link from 'next/link';
import { Menu } from '../icons/menu';
import { Close } from '../icons/close';

export function Header({ className, ...props }: ComponentProps<'header'>) {
  const [isOpen, setIsOpen] = useState(false);
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
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="w-[29px]" />
          <TextLogo className="w-[114px] text-[#36168D]" />
        </div>
        <div className="tablet:hidden size-5" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <Close /> : <Menu />}
        </div>
      </div>

      <div
        className={cn(
          'hidden fixed inset-0 top-16 bg-black/25',
          isOpen && 'block',
          'tablet:static tablet:bg-transparent tablet:flex items-center gap-4'
        )}
      >
        <Navbar className={cn('bg-[#ebebeb] flex-col px-6 tablet:bg-transparent tablet:flex-row tablet:px-0')} />
        <Link
          href="https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-arm64.dmg"
          target="_blank"
          className="hidden tablet:block shrink-0 py-2.5 px-6 bg-[#242437] rounded-md font-semibold text-sm text-white"
        >
          Download Cronus
        </Link>
      </div>
    </header>
  );
}

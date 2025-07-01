'use client';
import { useState, type ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import { Logo, TextLogo } from '../logo';
// import { Navbar } from '../navbar/navbar';
import { Menu } from '../icons/menu';
import { Close } from '../icons/close';
import Image from 'next/image';

export function Header({ className, ...props }: ComponentProps<'header'>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = () => {
    window.open('https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-arm64.dmg', '_blank');
    window.location.href = '/get-started';
  };

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
      <div className="flex items-center justify-between w-full tablet:w-auto">
        <div className="flex items-center gap-2">
          <Logo className="w-[29px] text-black" />
          <TextLogo className="w-[114px] text-black" />
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
        {/* <Navbar
          className={cn(
            'bg-[#ebebeb] flex-col px-6 tablet:bg-transparent tablet:flex-row tablet:px-0'
          )}
        /> */}
        <button
          onClick={handleDownload}
          className="hidden tablet:flex items-center gap-2 shrink-0 py-2.5 px-6 bg-[#242437] rounded-md font-semibold text-sm text-white hover:bg-[#1a1a2e] transition-colors"
        >
          <Image src="/apple.png" alt="Apple" width={16} height={16} />
          Download Cronus
        </button>
      </div>
    </header>
  );
}

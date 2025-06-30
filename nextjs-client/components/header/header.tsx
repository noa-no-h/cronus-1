import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import { TextLogo } from '../logo';
import { Navbar } from '../navbar/navbar';

export function Header({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      className={
        cn('fixed inset-x-0 top-0 z-50 bg-white', 'h-[90px]', 'flex items-center justify-between', 'px-12', className)
      }
      {...props}
    >
      <TextLogo className='w-[114px] text-[#36168D]' />
      <div className='flex items-center gap-4'>
        <Navbar />
        <button className="py-2.5 px-6 bg-[#242437] rounded-md font-semibold text-sm text-white">Try cronus</button>
      </div>
    </header>
  );
}

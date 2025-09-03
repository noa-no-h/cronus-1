'use client';
import { useState, type ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import { Logo, TextLogo } from '../logo';
// import { Navbar } from '../navbar/navbar';
import Link from 'next/link';
import { Close } from '../icons/close';
import { Menu } from '../icons/menu';
import { Navbar } from '../navbar/navbar';
import DownloadButton from '../ui/download-button';
import { GitHubButton } from '../ui/github-button';
import { GITHUB_REPOSITORY } from '~/lib/constants';

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
      <div className="flex items-center justify-between w-full tablet:w-auto">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo className="w-[29px] text-accent" />
          <TextLogo className="w-[114px] text-black" />
        </Link>
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
        <GitHubButton
          repository={GITHUB_REPOSITORY}
          className="tablet:hidden shrink-0 mx-6 mb-4"
          size="sm"
          variant="primary"
        >
          Star on GitHub
        </GitHubButton>
        <GitHubButton
          repository={GITHUB_REPOSITORY}
          className="hidden tablet:flex shrink-0"
          size="sm"
          variant="primary"
        >
          Star
        </GitHubButton>
        <Navbar
          className={cn('bg-white flex-col px-6 tablet:bg-transparent tablet:flex-row tablet:px-0')}
          onLinkClick={() => setIsOpen(false)}
        />
        <DownloadButton className="hidden tablet:flex shrink-0" location="header_navbar" />
      </div>
    </header>
  );
}

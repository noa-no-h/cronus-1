'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationMenu } from 'radix-ui';
import { cn } from '~/lib/cn';

const NavbarItem = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <NavigationMenu.Item className="w-full border-b-[0.5px] border-b-neutral-300 tablet:border-b-0">
      <NavigationMenu.Link asChild className="block pl-2 py-4 tablet:py-3 tablet:px-4">
        <Link
          href={href}
          className={cn(
            'text-sm tablet:text-base transition-colors font-normal',
            isActive ? 'text-blue-600 font-medium' : 'text-primary/80 hover:text-primary/50'
          )}
        >
          {children}
        </Link>
      </NavigationMenu.Link>
    </NavigationMenu.Item>
  );
};

export function Navbar({ className }: { className?: string }) {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List className={cn('flex items-center', 'text-sm', className)}>
        <NavbarItem href="/blog">Blog</NavbarItem>
        <NavbarItem href="/about">About</NavbarItem>
        <NavbarItem href="/teams">Teams</NavbarItem>
        <NavbarItem href="/#privacy">Privacy</NavbarItem>

        {/* <NavigationMenu.Item className="w-full border-b-[0.5px] border-b-[#CDCDCD] tablet:border-b-0">
          <NavigationMenu.Link asChild className="block pl-2 py-4 tablet:py-3 tablet:px-4">
            <Link
              href="/features"
              className="text-primary hover:text-primary/60 transition-colors font-medium"
            >
              Features
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item className="w-full border-b-[0.5px] border-b-neutral-300 tablet:border-b-0">
          <NavigationMenu.Link asChild className="block pl-2 py-4 tablet:py-3 tablet:px-4">
            <Link
              href="/pricing"
              className="text-primary hover:text-primary/60 transition-colors font-medium"
            >
              Pricing
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item> */}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

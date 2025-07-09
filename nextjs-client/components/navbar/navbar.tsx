import Link from 'next/link';
import { NavigationMenu } from 'radix-ui';
import { cn } from '~/lib/cn';

export function Navbar({ className }: { className?: string }) {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List className={cn('flex items-center', 'text-sm', className)}>
        <NavigationMenu.Item className="w-full border-b-[0.5px] border-b-neutral-300 tablet:border-b-0">
          <NavigationMenu.Link asChild className="block pl-2 py-4 tablet:py-3 tablet:px-4">
            <Link
              href="/blog"
              className="text-primary hover:text-accent/80 transition-colors font-semibold"
            >
              Blog
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        {/* <NavigationMenu.Item className="w-full border-b-[0.5px] border-b-[#CDCDCD] tablet:border-b-0">
          <NavigationMenu.Link asChild className="block pl-2 py-4 tablet:py-3 tablet:px-4">
            <Link
              href="/features"
              className="text-primary hover:text-purple-600 transition-colors font-medium"
            >
              Features
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item className="w-full border-b-[0.5px] border-b-neutral-300 tablet:border-b-0">
          <NavigationMenu.Link asChild className="block pl-2 py-4 tablet:py-3 tablet:px-4">
            <Link
              href="/pricing"
              className="text-primary hover:text-purple-600 transition-colors font-medium"
            >
              Pricing
            </Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item> */}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

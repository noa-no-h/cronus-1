import Link from "next/link";
import { NavigationMenu } from "radix-ui";
import { cn } from "~/lib/cn";

export function Navbar({ className }: { className?: string }) {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List className={cn("flex items-center", "text-sm", className)}>
        <NavigationMenu.Item>
          <NavigationMenu.Link asChild className="block py-3 px-4">
            <Link href="/product">Product</Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link asChild className="block py-3 px-4">
            <Link href="/features">Features</Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link asChild className="block py-3 px-4">
            <Link href="/pricing">Pricing</Link>
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

import { ReactNode } from 'react';
import { Navbar } from './navbar';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col container mx-auto px-4 py-8 pt-24">{children}</main>
    </div>
  );
}

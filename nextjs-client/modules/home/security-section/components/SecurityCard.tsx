import type { ComponentProps, ReactNode } from 'react';
import { cn } from '~/lib/cn';

interface SecurityCardProps extends ComponentProps<'li'> {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}

export function SecurityCard({ icon, title, description, className, ...props }: SecurityCardProps) {
  return (
    <li
      className={cn(
        'pt-10 tablet:pt-16 desktop:pt-[54px]',
        'bg-zinc-50 rounded-2xl overflow-hidden',
        'border-[0.5px] border-solid border-neutral-300',
        'flex flex-col',
        'p-8 desktop:py-9 desktop:px-[56px]', // Keep these for internal padding/sizing
        'w-full tablet:w-[400px] desktop:w-[470px]', // Keep these for width
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-start gap-4">
        <div className="size-28 flex items-center justify-center">{icon}</div>
        <h5 className="font-semibold text-xl tablet:text-2xl tracking-[-0.03em] text-left">
          {title}
        </h5>
        <p className="text-md text-left leading-[1.5] text-neutral-500">{description}</p>
      </div>
    </li>
  );
}

import type { ComponentProps } from 'react';
import { TextLogo } from '~/components/logo';
import { cn } from '~/lib/cn';
import { Circle } from './circle';

export function HeroSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('bg-[#ebebeb] relative', className)} {...props}>
      <div className=" absolute inset-x-0">
        <Circle className="w-full max-w-[1172px] mx-auto" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-6 mt-[114px]">
        <TextLogo className="w-[200px]" />
        <p className="font-medium text-2xl tracking-[-3%] text-center">
          Understand where your time went and <br /> reduce distractions.
        </p>
        <button className="py-2.5 px-6 bg-[#242437] rounded-md font-semibold text-sm text-white">
          Try cronus Beta
        </button>
      </div>

      <div className="h-[410px] w-[880px] mx-auto bg-zinc-300 mt-[104px]"></div>
    </section>
  );
}

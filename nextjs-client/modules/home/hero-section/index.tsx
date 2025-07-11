import type { ComponentProps } from 'react';
import { TextLogo } from '~/components/logo';
import DownloadButton from '~/components/ui/download-button';
import { cn } from '~/lib/cn';

import { Clock } from './clock';
import { LeftFrame } from './left-frame';
import { RightFrame } from './right-frame';
import { TimerFrame } from './timer-frame';

export function HeroSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('relative overflow-hidden', 'pt-16 tablet:pt-24', className)} {...props}>
      <Clock />

      <div className="relative z-10 flex flex-col items-center space-y-6 mt-[114px] desktop:mt-[90px]">
        <TextLogo className="w-[150px] tablet:w-[200px] text-black" />
        <p
          className={cn(
            'w-[358px] tablet:w-[474px]',
            'font-medium font-serif text-sm tablet:text-2xl tracking-[-0.03em] text-center text-black'
          )}
        >
          Understand where your time went and reduce distractions.
        </p>
        <DownloadButton location="hero_section" />
      </div>

      <div className="mt-[68px] tablet:mt-[71px] flex justify-center">
        <div
          className={cn(
            'relative inline-flex px-4',
            'tablet:top-[34px] tablet:px-0 tablet:justify-center tablet:items-start tablet:gap-2',
            'desktop:top-8'
          )}
        >
          <LeftFrame className={cn('w-[358px] tablet:w-[354px] desktop:w-[452px]')} />
          <RightFrame
            className={cn(
              'absolute w-[312px] bottom-[-170px] right-9',
              'tablet:static tablet:w-[354px] desktop:w-[419px]'
            )}
          />
          <TimerFrame
            className={cn(
              'absolute w-[324px] bottom-[94px] right-6',
              'tablet:w-[460px] tablet:bottom-[34px] tablet:right-1.5',
              'desktop:w-[520px] desktop:bottom-[84px] desktop:right-[-92px]'
            )}
          />
        </div>
      </div>
    </section>
  );
}

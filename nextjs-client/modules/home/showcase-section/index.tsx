import Image from 'next/image';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import macosPng from './macos.png';

import { TimeFrame } from './time-frame';
import { AppsFrame } from './apps-frame';
import { Tracker } from './tracker';

export function ShowcaseSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'bg-zinc-100 overflow-hidden',
        'py-16 tablet:py-30',
        'space-y-20 tablet:space-y-30',
        'flex flex-col items-center',
        'px-4 tablet:px-16 desktop:px-0',
        className
      )}
      {...props}
    >
      <div
        className={cn('desktop:flex desktop:flex-row-reverse desktop:items-center desktop:gap-20')}
      >
        <div className={cn('text-primary space-y-6', 'tablet:w-[682px] desktop:w-[480px]')}>
          <h3
            className={cn(
              'font-medium font-serif tracking-tight whitespace-nowrap',
              'text-xl tablet:text-3xl'
            )}
          >
            AI Time and distraction tracking
          </h3>
          <p
            className={cn(
              'tracking-[-0.03em] leading-[1.5]',
              'text-sm tablet:text-base',
              'tablet:w-full desktop:w-[428px]'
            )}
          >
            How many hours have you worked last week? How much time were you distracted? Cronus
            helps you answer these questions using context-aware ai (Not just rule-based
            categorization).
          </p>
        </div>
        <div className="relative mt-8 tablet:w-full tablet:mt-12 desktop:w-[540px]">
          <TimeFrame className="w-full" />
          <AppsFrame
            className={cn(
              'absolute',
              'w-80 top-[60px] left-[-54px]',
              'tablet:w-[440px] tablet:top-[116px] tablet:left-[-84px]',
              'desktop:w-[327px] desktop:top-20 desktop:left-[-100px]'
            )}
          />
        </div>
      </div>

      <div className={cn('space-y-8 desktop:flex desktop:items-center desktop:gap-20')}>
        <div
          className={cn(
            'text-primary space-y-6',
            'tablet:w-[682px]',
            'desktop:w-[480px] desktop:pl-8'
          )}
        >
          <h3 className={cn('font-medium font-serif tracking-tight', 'text-xl tablet:text-3xl')}>
            Gamified productivity with Mini-Timer
          </h3>
          <p
            className={cn(
              'text-sm tablet:text-base',
              'tracking-[-0.02em] tablet:tracking-[-0.03em] leading-[1.5]'
            )}
          >
            See your productivity counting up life. No annoying and rule-based blockers. Sometimes
            you have to used distracted websites for work. Cronus understand what you are doing and
            categorizes your work accordingly.
          </p>
        </div>
        <div className={cn('relative', 'tablet:w-[682px] desktop:w-[540px]')}>
          <Image src={macosPng} alt="Gamified productivity with Mini-Timer" />
          <Tracker
            className={cn(
              'absolute',
              'w-[370px] top-9 right-5',
              'tablet:w-[760px] tablet:top-[60px] tablet:-right-20',
              "desktop:w-[480px] desktop:left-[114px]"
            )}
          />
        </div>
      </div>
    </section>
  );
}

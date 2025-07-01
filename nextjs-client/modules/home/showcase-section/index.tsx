import Image from 'next/image';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import timerPng from './timer.png';
import trackingPng from './tracking.png';

export function ShowcaseSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'bg-[#f4f4f4] space-y-[120px]',
        'flex flex-col items-center',
        'tablet:px-16 desktop:px-0',

        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex items-center',
          'tablet:gap-8 desktop:gap-20',
          'tablet:flex-col-reverse desktop:ml-[-200px] desktop:flex-row'
        )}
      >
        <Image
          className="tablet:w-full desktop:w-[600px]"
          src={trackingPng}
          width={600}
          alt="AI Time and distraction tracking"
        />
        <div className={cn('text-[#242437] space-y-6', 'tablet:w-[682px] desktop:w-[480px]')}>
          <h3 className="font-semibold text-[32px] tracking-[-3%] whitespace-nowrap">
            AI Time and distraction tracking
          </h3>
          <p className={cn('tracking-[-3%] leading-[1.5]', 'tablet:w-full desktop:max-w-[428px]')}>
            How many hours have you worked last week? How much time were you distracted? Cronus
            helps you answer these questions using context-aware ai (Not just rule-based
            categorization).
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex items-center',
          'tablet:gap-8 desktop:gap-20',
          'tablet:flex-col desktop:flex-row'
        )}
      >
        <div className={cn('text-[#242437] space-y-6', 'desktop:w-[480px] desktop:pl-8', 'table:w-full')}>
          <h3 className="font-semibold text-[32px] tracking-[-3%]">
            Gamified productivity with Mini-Timer
          </h3>
          <p className="tracking-[-3%] leading-[1.5] tablet:text-pretty desktop:text-balance">
            See your productivity counting up life. No annoying and rule-based blockers. Sometimes
            you have to used distracted websites for work. Cronus understand what you are doing and
            categorizes your work accordingly.
          </p>
        </div>
        <Image src={timerPng} alt="Gamified productivity with Mini-Timer" width={600} />
      </div>
    </section>
  );
}

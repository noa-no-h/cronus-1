import Image from 'next/image';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import timerPng from './timer.png';
import trackingPng from './tracking.png';

export function ShowcaseSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('bg-[#f4f4f4] space-y-[120px]', className)} {...props}>
      <div className="flex items-center gap-20">
        <Image src={trackingPng} alt=" AI Time and distraction tracking" width={600} />
        <div className="text-[#242437] space-y-6">
          <h3 className="font-semibold text-[32px] tracking-[-3%]">
            AI Time and distraction tracking
          </h3>
          <p className="tracking-[-3%] leading-[1.5] text-balance">
            How many hours have you worked last week? How much time were you distracted? Cronus
            helps you answer these questions using context-aware ai (Not just rule-based
            categorization).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-20">
        <div className="text-[#242437] space-y-6">
          <h3 className="font-semibold text-[32px] tracking-[-3%]">
            Gamified productivity with Mini-Timer
          </h3>
          <p className="tracking-[-3%] leading-[1.5] text-balance">
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

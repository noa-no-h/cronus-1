import Image from 'next/image';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import calendarAIPng from './calendar-ai.png';
import mobileTrackingPng from './mobile-tracking.png';
import smartNudgesPng from './smart-nudges.png';

import { ScrollPreventAnimation } from './scroll-prevent-animation';

const cardClassnames = cn(
  'pt-10 tablet:pt-16 desktop:pt-[54px]',
  'bg-zinc-50 rounded-2xl overflow-hidden',
  'border-[0.5px] border-neutral-300',
  'flex flex-col'
);

export function FeaturesSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'bg-white text-primary',
        'flex flex-col items-center',
        'px-4 py-12 tablet:py-20 tablet:px-0',
        className
      )}
      {...props}
    >
      <h2 className="text-2xl tablet:text-3xl tracking-tight text-center">
        Features that help you lock in
      </h2>

      <ul
        className={cn(
          'mt-12 tablet:mt-20',
          'grid gap-6',
          'tablet:grid-cols-1 tablet:px-16',
          'lg:grid-cols-2 lg:px-16',
          'desktop:grid-cols-[repeat(2,528px)]'
        )}
      >
        <li className={cardClassnames}>
          <div className="px-6 tablet:px-8 grow">
            <h3 className="tracking-[-0.03em] font-semibold text-xl tablet:text-2xl">
              Calendar AI or manual tracking
            </h3>
            <p className="tracking-[-0.02em] text-sm mt-4 tablet:mt-6 leading-[1.5]">
              Went to a conference, had dinner with friends? Cronus helps you track your
              non-computer time using your calendar for context, or create manual entries in one
              click.
            </p>
          </div>
          <Image src={calendarAIPng} alt="Calendar AI or manual tracking" />
        </li>

        <li className={cardClassnames}>
          <div className="px-6 tablet:px-8 grow">
            <h3 className="tracking-[-0.03em] font-semibold text-xl tablet:text-2xl">
              Smart nudges
            </h3>
            <p className="tracking-[-0.02em] text-sm mt-4 tablet:mt-6 leading-[1.5]">
              Cronus understands your distraction and productivity patterns, helping you avoid the
              root causes and reach your daily and life goals.
            </p>
          </div>
          <Image src={smartNudgesPng} alt="Smart nudges" />
        </li>

        <li className={cardClassnames}>
          <div className="px-6 tablet:px-8 grow">
            <h3 className="tracking-[-0.03em] font-semibold text-xl tablet:text-2xl">
              Mobile tracking
            </h3>
            <p className="tracking-[-0.02em] text-sm mt-4 tablet:mt-6 leading-[1.5]">
              Cronus is the first cross-platform time and distraction tracking software. See how
              productive you were across all your devices in one dashboard (coming soon).
            </p>
          </div>
          <Image src={mobileTrackingPng} alt="Mobile tracking" />
        </li>

        <li className={cardClassnames}>
          <div className="px-6 tablet:px-8 grow">
            <h3 className="tracking-[-0.03em] font-semibold text-xl tablet:text-2xl">
              Doom scroll prevention
            </h3>
            <p className="tracking-[-0.02em] text-sm mt-4 tablet:mt-6 leading-[1.5]">
              Cronus is not rule-based. Sometimes you need to go on LinkedIn or Twitter to look at
              people&apos;s profiles or just catch up with your network. However, doom scrolling is
              categorized as a distraction.
            </p>
          </div>

          <div className="grow">
            <ScrollPreventAnimation />
          </div>
        </li>
      </ul>
    </section>
  );
}

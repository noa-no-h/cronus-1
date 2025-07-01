import Image from 'next/image';
import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';
import calendarAIPng from './calendar-ai.png';
import mobileTrackingPng from './mobile-tracking.png';
import scrollPreventionPng from './scroll-prevention.png';
import smartNudgesPng from './smart-nudges.png';

export function FeaturesSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('bg-white text-[#242437] py-[160px]', 'flex flex-col items-center', className)}
      {...props}
    >
      <h3 className="font-semibold text-[32px] tracking-[-3%] text-center">Other features</h3>

      <ul className="grid grid-cols-1 md:grid-cols-[repeat(2,528px)] gap-6 mt-20">
        <li
          className={cn(
            'pt-[54px]',
            'bg-[#FAFAFA] rounded-2xl overflow-hidden',
            'border-[0.5px] border-[#dfdfdf]'
          )}
        >
          <div className="mx-8">
            <h4 className="tracking-[-3%] font-semibold text-2xl">
              Calendar AI or manual tracking
            </h4>
            <p className="tracking-[-2%] text-sm mt-6 leading-[1.5]">
              Went to a conference, had a dinner with friends? Cronus helps you track your
              non-computer time using your calendar for context. Or create manual entries in one
              click.
            </p>
          </div>
          <Image src={calendarAIPng} alt="Calendar AI or manual tracking" />
        </li>

        <li
          className={cn(
            'pt-[54px]',
            'bg-[#FAFAFA] rounded-2xl overflow-hidden',
            'border-[0.5px] border-[#dfdfdf]'
          )}
        >
          <div className="mx-8">
            <h4 className="tracking-[-3%] font-semibold text-2xl">Smart nudges</h4>
            <p className="tracking-[-2%] text-sm mt-6 leading-[1.5]">
              Cronus understands your distraction and productivity patterns and helps you avoid the
              root causes and helps you reach your daily and even life goals.
            </p>
          </div>
          <Image src={smartNudgesPng} alt="Smart nudges" />
        </li>

        <li
          className={cn(
            'pt-[54px]',
            'bg-[#FAFAFA] rounded-2xl overflow-hidden',
            'border-[0.5px] border-[#dfdfdf]'
          )}
        >
          <div className="mx-8">
            <h4 className="tracking-[-3%] font-semibold text-2xl">Mobile tracking</h4>
            <p className="tracking-[-2%] text-sm mt-6 leading-[1.5]">
              Cronus is the first cross-platform time and distraction tracking software. See how
              productive you were across all your devices in one dashboard (Comming Soon).
            </p>
          </div>
          <Image src={mobileTrackingPng} alt="Mobile tracking" />
        </li>

        <li
          className={cn(
            'pt-[54px]',
            'bg-[#FAFAFA] rounded-2xl overflow-hidden',
            'border-[0.5px] border-[#dfdfdf]'
          )}
        >
          <div className="mx-8">
            <h4 className="tracking-[-3%] font-semibold text-2xl">Doom scroll prevention</h4>
            <p className="tracking-[-2%] text-sm mt-6 leading-[1.5]">
              Cronus is not rule-based. Sometimes you need to go on LinkedIn or Twitter to look at
              people&apos;s profiles or just catch up with your network. However, doom scrolling is
              categorized as a distraction.
            </p>
          </div>
          <Image src={scrollPreventionPng} alt="Doom scroll prevention" />
        </li>
      </ul>
    </section>
  );
}

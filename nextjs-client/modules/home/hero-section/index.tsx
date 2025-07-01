import Link from 'next/link';
import type { ComponentProps } from 'react';
import { TextLogo } from '~/components/logo';
import { cn } from '~/lib/cn';
import { Circle } from './circle';

import { ClockFrame } from './clock-frame';
import { LeftFrame } from './left-frame';
import { RightFrame } from './right-frame';

export function HeroSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('bg-[#ebebeb] relative overflow-hidden',"pt-[62px] tablet:pt-[90px]", className)} {...props}>
      <div className="absolute inset-x-0 top-[160px]">
        <Circle className="w-[722px] absolute left-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-6 mt-[114px]">
        <TextLogo className="w-[150px] tablet:w-[200px] text-black" />
        <p className={cn("w-[358px] tablet:[474px]","font-medium text-sm tablet:text-2xl tracking-[-3%] text-center text-black")}>
          Understand where your time went and reduce distractions.
        </p>
        <Link
          href="https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-arm64.dmg"
          target="_blank"
          className="py-2.5 px-6 bg-[#242437] rounded-md font-semibold text-sm text-white"
        >
          Download Cronus
        </Link>
      </div>

      <div className="mt-[68px] tablet:mt-[80px] flex justify-center">
        <div className={cn("relative inline-flex w-full px-4","tablet:top-[54px] tablet:px-0 tablet:justify-center tablet:items-start tablet:gap-2","desktop:top-[32px] ")}>
          <LeftFrame className={cn("w-full tablet:w-[354px] desktop:w-[452px]")} />
          <RightFrame className={cn("absolute w-[312px] bottom-[-170px] right-[-36px]","tablet:static tablet:w-[354px] tablet:mt-[12px] desktop:w-[419px]")} />
          <ClockFrame
            className={cn(
              'absolute w-[324px] bottom-[94px] right-[-24px]',
              'tablet:w-[460px] tablet:top-[220px] tablet:right-[-44px]',
              'desktop:w-[520px] desktop:top-[184px] desktop:right-[-90px]'
            )}
          />
        </div>
      </div>
    </section>
  );
}

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
    <section className={cn('bg-[#ebebeb] relative overflow-hidden', className)} {...props}>
      <div className=" absolute inset-x-0">
        <Circle className="w-full max-w-[1172px] mx-auto" />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-6 mt-[114px]">
        <TextLogo className="w-[200px] text-black" />
        <p className="font-medium text-2xl tracking-[-3%] text-center text-black">
          Understand where your time went and <br /> reduce distractions.
        </p>
        <Link
          href="https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-arm64.dmg"
          target="_blank"
          className="py-2.5 px-6 bg-[#242437] rounded-md font-semibold text-sm text-white"
        >
          Download Cronus
        </Link>
      </div>

      <div className="mt-[80px] flex justify-center">
        <div className="relative top-[32px] inline-flex justify-center items-start gap-2 ">
          <LeftFrame className="w-[452px]" />
          <RightFrame className="w-[419px]" />
          <ClockFrame className="w-[520px] absolute top-[184px] right-[-90px]" />
        </div>
      </div>
    </section>
  );
}

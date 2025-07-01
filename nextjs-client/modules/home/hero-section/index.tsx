import Image from 'next/image';
import type { ComponentProps } from 'react';
import { TextLogo } from '~/components/logo';
import { cn } from '~/lib/cn';
import { Circle } from './circle';
import clockFrame from './clock-frame.png';
import leftFrame from './left-frame.png';
import rightFrame from './right-frame.png';

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
        <button
          onClick={() => {
            window.open(
              'https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-arm64.dmg',
              '_blank'
            );
          }}
          className="py-2.5 px-6 bg-[#242437] rounded-md font-semibold text-sm text-white"
        >
          Download Cronus
        </button>
      </div>

      <div className="mt-[80px] flex justify-center">
        <div className="relative top-[32px] inline-flex justify-center items-start gap-2 ">
          <Image className="w-[452px]" src={leftFrame} alt="cronus example" />
          <Image className="w-[419px]" src={rightFrame} alt="cronus example" />
          <Image
            className="w-[520px] absolute top-[184px] right-[-90px]"
            src={clockFrame}
            alt="cronus example"
          />
        </div>
      </div>
    </section>
  );
}

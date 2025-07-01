import Image from 'next/image';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { TextLogo } from '~/components/logo';
import { cn } from '~/lib/cn';
import { Circle } from './circle';
import hourglass from './hourglass.png';

export function CTASection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <>
      <section
        className={cn(
          'relative bg-[#f4f4f4]',
          'flex flex-col items-center mt-[-4px]',
          'h-[540px]',
          className
        )}
        {...props}
      >
        <div className='absolute inset-x-0 top-0'>
        <Circle className="w-[1440px] absolute left-1/2 -translate-x-1/2" />
        </div>
        <Image className="mt-[-80px]" src={hourglass} width={400} alt="cronus" draggable={false} />
        <div className="w-[150px] mx-auto mt-[-236px] gird place-items-center">
          <TextLogo className="w-[150px] text-black" />
        </div>
        <p className="text-sm tablet:text-xl tracking-[-3%] mt-[15px] text-black">
          The smartest way to stay focused.
        </p>
        <Link
          href="https://cronusnewupdates.s3.amazonaws.com/Cronus-latest-arm64.dmg"
          target="_blank"
          className={cn("mt-[30px] tablet:mt-4 desktop:mt-7","py-2.5 px-6", "rounded-md bg-[#242437]","font-semibold text-sm text-white")}
        >
          Download Cronus
        </Link>
      </section>
    </>
  );
}

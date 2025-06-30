import Image from 'next/image';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { TextLogo } from '~/components/logo';
import { cn } from '~/lib/cn';
import { CircleSvg } from './circle-svg';
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
        <CircleSvg className="absolute w-[1440px] pointer-events-none" />
        <Image className="mt-[-80px]" src={hourglass} width={400} alt="cronus" draggable={false} />
        <div className="w-[150px] mx-auto mt-[-236px] gird place-items-center">
          <TextLogo className="w-[150px]" />
        </div>
        <p className="text-xl tracking-[-3%] mt-[15px]">The smartest way to stay focused.</p>
        <button className="py-2.5 px-6 bg-[#242437] rounded-md font-semibold text-sm text-white mt-[30px]">
          <Link href="/">Try cronus Beta</Link>
        </button>
      </section>
    </>
  );
}

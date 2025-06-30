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
      <svg
        width="100%"
        height="24"
        viewBox="0 0 1440 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M720 -6.29444e-05C338 -9.63399e-05 -2.09816e-06 24 -2.09816e-06 24L1440 24.0001C1440 24.0001 1102 -2.95489e-05 720 -6.29444e-05Z"
          fill="#F4F4F4"
        />
      </svg>

      <section
        className={cn(
          'relative bg-[#f4f4f4]',
          'flex flex-col items-center mt-[-4px]',
          'h-[540px]',
          className
        )}
        {...props}
      >
        <CircleSvg className="absolute w-full max-w-[1440px]" />
        <Image src={hourglass} width={232} alt="cronus" />
        <TextLogo className="w-[150px] mx-auto mt-[-136px]" />
        <p className="text-xl tracking-[-3%] mt-[15px]">The smartest way to stay focused.</p>
        <button className="py-2.5 px-6 bg-[#242437] rounded-md font-semibold text-sm text-white mt-[30px]">
          <Link href="/">Try cronus Beta</Link>
        </button>
      </section>
    </>
  );
}

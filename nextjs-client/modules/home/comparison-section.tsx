import type { ComponentProps } from 'react';
import { Logo, TextLogo } from '~/components/logo';
import { cn } from '~/lib/cn';

export function ComparisonSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'bg-white text-[#242437] pt-40 pb-[136px]',
        'flex flex-col items-center',
        className
      )}
      {...props}
    >
      <h3 className="font-semibold text-[32px] tracking-[-3%] text-center">Cronus vs others</h3>

      <div
        className={cn(
          'mt-20',
          'inline-flex items-center',
          'rounded-2xl overflow-hidden',
          'border-[0.5px] border-[#dfdfdf] tracking-[-2%]',
          'bg-[#fafafa]'
        )}
      >
        <div
          className={cn(
            'w-[464px] bg-[#faf8ff] py-9 px-[56px] text-[#36168D]',
            'border-r-[0.5px] border-[#DFDFDF]'
          )}
        >
          <h5 className="flex items-center gap-2">
            <Logo className="w-[28px]" />
            <TextLogo className="w-[108px]" />
          </h5>
          <ul
            className={cn(
              'text-xl',
              'mt-5',
              '[&>li]:py-5 [&>li]:border-t-[0.5px] [&>li]:border-[#36168D14]',
              '[&>li:last-child]:pb-0'
            )}
          >
            <li>Goal-aware distraction nudging</li>
            <li>Passive + contextual</li>
            <li>Cross-device analysis</li>
            <li>Clean, proactive design</li>
          </ul>
        </div>
        <div className="w-[464px] py-9 px-[56px]">
          <h5 className="font-semibold text-2xl tracking-[-3%]  leading-[32px]">
            Traditional Time Trackers
          </h5>
          <ul
            className={cn(
              'text-xl',
              'mt-5',
              '[&>li]:py-5 [&>li]:border-t-[0.5px] [&>li]:border-[#36168D14]',
              '[&>li:last-child]:pb-0'
            )}
          >
            <li>Rule-based blocking</li>
            <li>Manual task tracking</li>
            <li>Per-device stats only</li>
            <li>Overwhelming, rigid, clunky</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

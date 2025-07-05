import type { ComponentProps } from 'react';
import { Device } from '~/components/icons/device';
import { Goal } from '~/components/icons/goal';
import { List } from '~/components/icons/list';
import { Pencil } from '~/components/icons/pencil';
import { Logo, TextLogo } from '~/components/logo';
import { cn } from '~/lib/cn';

export function ComparisonSection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'bg-white text-primary',
        'py-16 tablet:py-40',
        'flex flex-col items-center',
        className
      )}
      {...props}
    >
      <h3 className="font-semibold text-2xl tablet:text-[32px] tracking-[-0.03em] text-center">
        Cronus vs others
      </h3>

      <div className={cn('mt-12 tablet:mt-20', 'px-4','max-w-full overflow-x-scroll no-scrollbar')}>
        <ul
          className={cn(
            'inline-flex tablet:item-start desktop:items-center',
            'rounded-2xl overflow-hidden',
            'border-[0.5px] border-[#dfdfdf] tracking-[-0.02em]',
            'bg-[#faf8ff]'
          )}
        >
          <li
            className={cn(
              'text-[#36168D]',
              'p-8 desktop:py-9 desktop:px-[56px]',
              'border-r-[0.5px] border-[#DFDFDF]',
              'tablet:w-[357px] desktop:w-[464px]'
            )}
          >
            <h5 className="flex items-center gap-1.5">
              <Logo className="w-[28px]" />
              <TextLogo className="w-[108px]" />
            </h5>
            <ul
              className={cn(
                'text-xl',
                'mt-[13px] tablet:mt-4',
                '[&>li]:py-[13px]',
                '[&>li]:border-t-[0.5px] [&>li]:border-[#36168D14]',
                'tablet:[&>li]:py-4 desktop:[&>li]:py-5',
                '[&>li:last-child]:pb-0'
              )}
            >
              <li
                className={cn(
                  'flex items-center',
                  'leading-[1.5] tracking-[-0.02em]',
                  'gap-6 tablet:gap-4 desktop:gap-6'
                )}
              >
                <Goal className="size-6" />
                Goal-aware distraction nudging
              </li>
              <li
                className={cn(
                  'flex items-center',
                  'leading-[1.5]',
                  'gap-6 tablet:gap-4 desktop:gap-6'
                )}
              >
                <List className="size-6" />
                Passive + contextual
              </li>
              <li
                className={cn(
                  'flex items-center',
                  'leading-[1.5]',
                  'gap-6 tablet:gap-4 desktop:gap-6'
                )}
              >
                <Device className="size-6" />
                Cross-device analysis
              </li>
              <li
                className={cn(
                  'flex items-center',
                  'leading-[1.5]',
                  'gap-6 tablet:gap-4 desktop:gap-6',
                  'whitespace-nowrap'
                )}
              >
                <Pencil className="size-6" />
                Clean, proactive design
              </li>
            </ul>
          </li>
          
          <li
            className={cn(
              'bg-[#fafafa] text-primary',
              'p-8 desktop:py-9 desktop:px-[56px]',
              'border-r-[0.5px] border-[#DFDFDF]',
              'tablet:w-[357px] desktop:w-[464px]'
            )}
          >
            <h5 className="font-semibold text-2xl tracking-[-0.03em] leading-[32px] whitespace-nowrap">
              Traditional Time Trackers
            </h5>
            <ul
              className={cn(
                'text-xl',
                'mt-[13px] tablet:mt-5',
                '[&>li]:py-4',
                'tablet:[&>li]:py-[21px] [&>li]:border-t-[0.5px] [&>li]:border-[#36168D14]',
                '[&>li:last-child]:pb-0'
              )}
            >
              <li>Rule-based blocking</li>
              <li>Manual task tracking</li>
              <li>Per-device stats only</li>
              <li>Overwhelming, rigid, clunky</li>
            </ul>
          </li>
        </ul>
      </div>
    </section>
  );
}

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
            'bg-[#faf8ff] py-9 px-[56px] text-[#36168D]',
            'border-r-[0.5px] border-[#DFDFDF]',
            'w-[357px] xl:w-[464px]'
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
            <li className="flex items-center gap-6">
              <Goal className="size-6" />
              Goal-aware distraction nudging
            </li>
            <li className="flex items-center gap-6">
              <List className="size-6" />
              Passive + contextual
            </li>
            <li className="flex items-center gap-6">
              <Device className="size-6" />
              Cross-device analysis
            </li>
            <li className="flex items-center gap-6">
              <Pencil className="size-6" />
              Clean, proactive design
            </li>
          </ul>
        </div>
        <div className={cn('py-9 px-[56px]', 'w-[357px] xl:w-[464px]')}>
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

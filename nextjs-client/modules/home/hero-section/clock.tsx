'use client';

import { cn } from '~/lib/cn';
import { ClockScale } from './clock-scale';
import { ClockFrame } from './clock-frame';

export function Clock() {
  return (
    <div
      className={cn(
        'absolute inset-x-0 top-[160px] tablet:top-[128px] desktop:top-[140px]',
        'h-full rotate-x-[72deg] translate-y-[-320px]'
      )}
    >
      <ClockScale className="w-[722px] tablet:w-[1172px] absolute left-1/2 -translate-x-1/2 animate-[spin_120s_linear_infinite]" />
      <ClockFrame className="w-[722px] tablet:w-[1100px] absolute left-1/2 -translate-x-1/2 top-[88px] animate-[spin_30s_infinite_reverse]" />
    </div>
  );
}

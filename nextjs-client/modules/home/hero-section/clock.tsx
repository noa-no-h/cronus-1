'use client';

import { cn } from '~/lib/cn';
import { ClockScale } from './clock-scale';
import { ClockFrame } from './clock-frame';

export function Clock() {
  return (
    <div
      className={cn(
        'absolute inset-x-0 top-[240px] tablet:top-[180px] desktop:top-[120px]',
        'h-full rotate-x-[72deg] translate-y-[-320px]',
      )}
    >
      <div className='absolute top-0 inset-x-0 left-1/2 -translate-x-1/2 z-10 w-[1800px] h-[1000px] bg-gradient-to-t from-transparent to-zinc-200'/>
      <ClockScale className="w-[722px] tablet:w-[1172px] absolute left-1/2 -translate-x-1/2 animate-[spin_120s_linear_infinite]" />
      <ClockFrame className="w-[722px] tablet:w-[1100px] absolute left-1/2 -translate-x-1/2 top-30 animate-[spin_30s_infinite_reverse]" />
    </div>
  );
}

'use client';

import { cn } from '~/lib/cn';
import { Circle } from './circle';

export function Clock() {
  return (
    <div
      className={cn(
        'absolute inset-x-0 top-[160px] tablet:top-[128px] desktop:top-[100px]',
        'h-full rotate-x-[72deg] translate-y-[-320px]'
      )}
    >
       <Circle className="w-[722px] tablet:w-[1172px] absolute left-1/2 -translate-x-1/2 animate-[spin_60s_steps(30,end)_infinite]" />
    </div>
  );
}

import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';

const SensitiveDataReductionIcon = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('w-full h-full relative', className)} {...props}>
    {/* Document background */}
    <div className="absolute left-[12.5%] w-[75%] h-full bg-blue-50/80 border-3 border-gray-400 rounded-sm" />

    {/* Lines of text */}
    <div className="absolute top-[18%] left-[29%] w-[11%] h-[3px] bg-blue-500 rounded-full" />
    <div className="absolute top-[28%] left-[29%] w-[41%] h-[3px] bg-blue-500 rounded-full" />
    <div className="absolute top-[42%] left-[29%] w-[41%] h-[3px] bg-blue-500 rounded-full" />
    <div className="absolute top-[56%] left-[29%] w-[33%] h-[3px] bg-blue-500 rounded-full" />
    <div className="absolute top-[70%] left-[29%] w-[20%] h-[3px] bg-blue-500 rounded-full" />

    {/* Redacted blocks */}
    <div className="absolute top-[39%] left-[29%] w-[25%] h-[8%] bg-black" />
    <div className="absolute top-[67%] left-[54%] w-[19%] h-[8%] bg-black" />
  </div>
);

export default SensitiveDataReductionIcon;

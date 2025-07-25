import { ComponentProps } from 'react';
import { cn } from '~/lib/utils';

const PermissionsToggleIcon = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('w-full h-full relative scale-110', className)} {...props}>
    {/* Row 1 */}
    <div className="absolute top-[23%] left-[15%] w-[40%] h-[7px] bg-gray-400 rounded-full" />
    <div className="absolute top-[20%] right-[15%] w-[20%] h-[12%] bg-blue-500 rounded-full" />
    <div className="absolute top-[22%] right-[17%] w-[8%] h-[8%] bg-white rounded-full" />

    {/* Row 2 */}
    <div className="absolute top-[46%] left-[15%] w-[40%] h-[7px] bg-gray-400 rounded-full" />
    <div className="absolute top-[43%] right-[15%] w-[20%] h-[12%] bg-blue-500 rounded-full" />
    <div className="absolute top-[45%] right-[17%] w-[8%] h-[8%] bg-white rounded-full" />

    {/* Row 3 */}
    <div className="absolute top-[69%] left-[15%] w-[40%] h-[7px] bg-gray-300 rounded-full" />
    <div className="absolute top-[66%] right-[15%] w-[20%] h-[12%] bg-gray-300 rounded-full" />
    <div className="absolute top-[68%] right-[25%] w-[8%] h-[8%] bg-white rounded-full" />
  </div>
);

export default PermissionsToggleIcon;

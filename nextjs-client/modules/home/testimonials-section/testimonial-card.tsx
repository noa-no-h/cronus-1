import Image, { StaticImageData } from 'next/image';
import { cn } from '~/lib/cn';

/* eslint-disable @next/next/no-img-element */
export function TestimonialCard({
  name,
  title,
  avatar,
  content,
}: {
  name: string;
  title: string;
  avatar: string | StaticImageData; // <-- allow both types
  content: string;
}) {
  return (
    <div
      className={cn(
        'inline-block rounded-2xl ',
        'bg-white',
        'text-primary tracking-[-0.02em]',
        'p-8',
        'tablet:py-10 tablet:px-8'
      )}
    >
      <p className="w-full h-[104px] tracking-[-0.02em] text-sm tablet:text-base">{content}</p>
      <div className="flex items-center gap-6 mt-6">
        <Image
          className="size-[56px] rounded-full bg-zinc-200"
          src={avatar}
          alt={name}
          width={56}
          height={56}
        />
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-sm tracking-[-0.02em]">{title}</div>
        </div>
      </div>
    </div>
  );
}

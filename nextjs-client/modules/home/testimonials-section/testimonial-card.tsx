import { cn } from "~/lib/cn";

/* eslint-disable @next/next/no-img-element */
export function TestimonialCard({
  name,
  title,
  avatar,
  content,
}: {
  name: string;
  title: string;
  avatar: string;
  content: string;
}) {
  return (
    <div className={cn("inline-block rounded-2xl ","bg-white","text-[#242437] tracking-[-2%]","p-8","tablet:py-10 tablet:px-8")}>
      <p className="w-full h-[104px] tracking-[-2%] text-sm tablet:text-base">{content}</p>
      <div className="flex items-center gap-6 mt-6">
        <img className="size-[56px] rounded-full bg-zinc-200" src={avatar} alt={name} />
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-sm tracking-[-2%]">{title}</div>
        </div>
      </div>
    </div>
  );
}

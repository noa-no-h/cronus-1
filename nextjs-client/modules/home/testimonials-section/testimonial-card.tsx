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
    <div className="inline-block bg-white rounded-2xl text-[#242437] py-10 px-8 tracking-[-2%] w-full">
      <p className="w-full h-[104px] tracking-[-2%] text-sm md:text-base">{content}</p>
      <div className="flex items-center gap-6 mt-6">
        <img className="size-[56px] rounded-full bg-zinc-200" src={avatar} alt={name} />
        <div>
          <div className="font-semibold ">{name}</div>
          <div className="text-sm">{title}</div>
        </div>
      </div>
    </div>
  );
}

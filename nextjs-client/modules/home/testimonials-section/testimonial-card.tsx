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
    <div className="inline-block bg-white rounded-2xl text-[#242437] py-10 px-8 tracking-[-2%]">
      <p className="w-[396px]">{content}</p>
      <div className="flex items-center gap-6 mt-6">
        <div className="size-[56px] rounded-full bg-zinc-200"></div>
        <div>
          <div className="font-semibold ">{name}</div>
          <div className="text-sm">{title}</div>
        </div>
      </div>
    </div>
  );
}

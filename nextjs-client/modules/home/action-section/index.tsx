import Image from 'next/image';

import actionGif from './action.gif';

export function ActionSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Cronus in action
          </h2>
        </div>

        <div className="mt-10 flex justify-center">
          <Image src={actionGif} alt="Cronus in action" className="rounded-lg shadow-lg" />
        </div>
      </div>
    </section>
  );
}

'use client';

import type { ComponentProps } from 'react';
import { useState } from 'react';
import DemoBookingModal from '~/components/ui/demo-booking-modal';
import { cn } from '~/lib/cn';

export function TeamsHero({ className, ...props }: ComponentProps<'section'>) {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <section className={cn('relative overflow-hidden', 'pt-16 tablet:pt-24', className)} {...props}>
      <div className="relative z-10 flex flex-col items-center space-y-8 mt-[114px] desktop:mt-[90px]">
        <div className="text-center space-y-6">
          <h1
            className={cn(
              'font-bold font-serif text-4xl tablet:text-5xl desktop:text-6xl tracking-[-0.03em] text-center text-black',
              'max-w-4xl'
            )}
          >
            Stop Revenue Leaks. <br />
            <span className="text-accent">Maximize Team Productivity.</span>
          </h1>
          <p
            className={cn(
              'w-full max-w-2xl mx-auto',
              'font-medium text-lg tablet:text-xl tracking-[-0.02em] text-center text-gray-600',
              'leading-relaxed'
            )}
          >
            Turn every work minute into billable revenue with AI-powered time tracking that your
            team actually wants to use.
          </p>
        </div>

        <div className="flex flex-col tablet:flex-row gap-4 tablet:gap-6 items-center">
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="px-8 py-4 text-base font-semibold text-accent border-2 border-accent hover:bg-accent hover:text-white transition-colors rounded-md"
          >
            Schedule Demo
          </button>
        </div>

        <div className="flex items-center gap-8 text-sm text-gray-500 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>+28 mins recovered daily</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>4-11% profit increase</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>2.88x more time entries</span>
          </div>
        </div>
      </div>

      <div className="mt-[68px] tablet:mt-[71px] flex justify-center">
        <div className="bg-gradient-to-r from-zinc-100 to-zinc-50 rounded-2xl p-8 tablet:p-12 shadow-lg max-w-5xl">
          <div className="grid grid-cols-1 tablet:grid-cols-3 gap-6 tablet:gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">$240K+</div>
              <div className="text-sm text-gray-600">Annual revenue recovered per team</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">45%</div>
              <div className="text-sm text-gray-600">Reduction in time entry errors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">5 min</div>
              <div className="text-sm text-gray-600">Daily time to complete timesheets</div>
            </div>
          </div>
        </div>
      </div>

      <DemoBookingModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </section>
  );
}

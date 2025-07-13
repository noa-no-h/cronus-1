import type { ComponentProps } from 'react';
import DownloadButton from '~/components/ui/download-button';
import { cn } from '~/lib/cn';

export function TeamsCTA({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'bg-gradient-to-br from-accent to-accent/80 text-white',
        'py-16 tablet:py-24 desktop:py-32',
        'px-4 tablet:px-8 desktop:px-12',
        className
      )}
      {...props}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl tablet:text-4xl desktop:text-5xl font-bold mb-6">
          Ready to Maximize Your Team's Revenue?
        </h2>
        <p className="text-xl tablet:text-2xl mb-8 text-white/90 leading-relaxed">
          Join thousands of professional services teams who've transformed their productivity and
          profitability with Cronus.
        </p>

        <div className="flex flex-col tablet:flex-row gap-6 justify-center items-center mb-12">
          {/* <DownloadButton
            location="teams_cta"
            className="bg-white text-accent hover:bg-white/90 px-8 py-4 text-lg font-semibold"
          >
            Start Free Trial
          </DownloadButton> */}
          <button className="px-8 py-4 text-lg font-semibold text-white border-2 border-white hover:bg-white hover:text-accent transition-colors rounded-md">
            Schedule Demo
          </button>
        </div>

        <div className="grid grid-cols-1 tablet:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="text-2xl font-bold mb-2">$240K+</div>
            <div className="text-white/80">Average annual revenue recovery per team</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="text-2xl font-bold mb-2">28 min</div>
            <div className="text-white/80">Daily billable time recovered per person</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="text-2xl font-bold mb-2">92%</div>
            <div className="text-white/80">Faster timesheet completion</div>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h3 className="text-2xl font-bold mb-4">Why Teams Choose Cronus</h3>
          <div className="grid grid-cols-1 tablet:grid-cols-2 gap-6 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <div className="font-semibold mb-1">AI-Powered Accuracy</div>
                <div className="text-white/80 text-sm">
                  Captures every billable minute automatically
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Real-Time Compliance</div>
                <div className="text-white/80 text-sm">
                  Prevents billing errors before they happen
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Enterprise Security</div>
                <div className="text-white/80 text-sm">SOC 2 certified with firm-specific AI</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0 mt-1">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Seamless Integration</div>
                <div className="text-white/80 text-sm">Works with your existing tools</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-white/80 text-sm">
          No credit card required • 14-day free trial • Cancel anytime
        </div>
      </div>
    </section>
  );
}

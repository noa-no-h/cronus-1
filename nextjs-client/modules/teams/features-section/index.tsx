import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';

const features = [
  {
    title: 'Automatic Revenue Recovery',
    description:
      'Capture every billable minute with AI-powered activity tracking. Never miss revenue from phone calls, offline work, or context switching.',
    icon: '💰',
    stats: '+28 mins daily',
  },
  {
    title: 'Real-Time Compliance',
    description:
      'Ensure all time entries meet client billing requirements with automatic validation and error prevention before submission.',
    icon: '✅',
    stats: '45% fewer errors',
  },
  {
    title: 'Team Performance Insights',
    description:
      'Understand true project costs, optimize resource allocation, and identify high-leverage opportunities across your entire team.',
    icon: '📊',
    stats: '4-11% profit increase',
  },
  {
    title: 'Effortless Time Entry',
    description:
      'AI generates detailed time descriptions in your style. Complete timesheets in 2 minutes instead of hours.',
    icon: '⚡',
    stats: '2 min daily',
  },
  {
    title: 'Enterprise Security',
    description:
      'SOC 2 Type II certified with firm-specific AI models. Your data stays private and secure.',
    icon: '🔒',
    stats: 'Enterprise-grade',
  },
  {
    title: 'Seamless Integration',
    description:
      'Works with your existing billing systems, calendars, and workflow tools. No disruption to current processes.',
    icon: '🔄',
    stats: '30+ integrations',
  },
];

export function TeamsFeatures({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'bg-white text-primary',
        'py-16 tablet:py-24 desktop:py-32',
        'px-4 tablet:px-8 desktop:px-12',
        className
      )}
      {...props}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl tablet:text-4xl font-bold tracking-tight mb-4">
            Built for Professional Services Teams
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything your team needs to maximize billable hours, ensure compliance, and drive
            profitable growth.
          </p>
        </div>

        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                'bg-zinc-50 rounded-2xl p-8',
                'hover:bg-zinc-100 transition-colors',
                'border border-zinc-200'
              )}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
              <div className="text-sm font-medium text-accent">{feature.stats}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-2xl p-8 tablet:p-12">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Transform Your Team's Productivity?
            </h3>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of professionals who've reclaimed their time and maximized their
              revenue with Cronus.
            </p>
            <div className="flex flex-col tablet:flex-row gap-4 justify-center">
              {/* <button className="px-8 py-3 bg-accent text-white font-semibold rounded-md hover:bg-accent/90 transition-colors">
                Start Free Trial
              </button> */}
              <button className="px-8 py-3 border-2 border-accent text-accent font-semibold rounded-md hover:bg-accent hover:text-white transition-colors">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

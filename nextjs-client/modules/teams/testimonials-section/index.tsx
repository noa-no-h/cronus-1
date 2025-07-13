import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    title: 'Managing Partner',
    company: 'Mitchell & Associates',
    content:
      'Cronus helped us recover over $180K in previously unbilled hours last year. Our team actually enjoys using it, which was our biggest concern with time tracking.',
    avatar: '👩‍💼',
    stats: '+$180K recovered',
  },
  {
    name: 'David Chen',
    title: 'CFO',
    company: 'TechLaw Partners',
    content:
      'The compliance features alone saved us countless hours of billing disputes. Our realization rate improved by 23% in the first quarter.',
    avatar: '👨‍💼',
    stats: '+23% realization',
  },
  {
    name: 'Maria Rodriguez',
    title: 'Operations Director',
    company: 'Rodriguez Consulting',
    content:
      'Finally, a time tracking solution that gives us real insights into our team productivity. We identified $50K in efficiency gains within 30 days.',
    avatar: '👩‍💼',
    stats: '+$50K efficiency',
  },
  {
    name: 'James Thompson',
    title: 'Senior Partner',
    company: 'Thompson & Co.',
    content:
      'Our associates used to spend 4+ hours weekly on timesheets. Now it takes 20 minutes. The time savings alone justify the investment.',
    avatar: '👨‍💼',
    stats: '92% time savings',
  },
  {
    name: 'Lisa Park',
    title: 'Practice Manager',
    company: 'Park Legal Group',
    content:
      'The AI narratives are incredibly accurate and match our billing requirements perfectly. Client disputes dropped by 60%.',
    avatar: '👩‍💼',
    stats: '60% fewer disputes',
  },
  {
    name: 'Robert Wilson',
    title: 'Managing Director',
    company: 'Wilson Advisory',
    content:
      "Best ROI of any software investment we've made. Paid for itself in the first month through recovered billable hours.",
    avatar: '👨‍💼',
    stats: '1 month ROI',
  },
];

export function TeamsTestimonials({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'bg-zinc-50 text-primary',
        'py-16 tablet:py-24 desktop:py-32',
        'px-4 tablet:px-8 desktop:px-12',
        className
      )}
      {...props}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl tablet:text-4xl font-bold tracking-tight mb-4">
            Trusted by Leading Professional Services Teams
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how teams across industries are maximizing their revenue and productivity with
            Cronus.
          </p>
        </div>

        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={cn(
                'bg-white rounded-2xl p-8',
                'shadow-sm hover:shadow-md transition-shadow',
                'border border-zinc-200'
              )}
            >
              <div className="flex items-center mb-6">
                <div className="text-3xl mr-4">{testimonial.avatar}</div>
                <div>
                  <div className="font-semibold text-lg">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.title}</div>
                  <div className="text-sm text-accent font-medium">{testimonial.company}</div>
                </div>
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">{testimonial.content}</p>

              <div className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full inline-block">
                {testimonial.stats}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 tablet:p-12 shadow-sm border border-zinc-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Join 10,000+ Professionals</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Teams using Cronus recover an average of $240K annually in previously unbilled hours.
            </p>

            <div className="grid grid-cols-1 tablet:grid-cols-4 gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">$240K+</div>
                <div className="text-sm text-gray-600">Avg. annual recovery</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">28 min</div>
                <div className="text-sm text-gray-600">Daily time saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">92%</div>
                <div className="text-sm text-gray-600">Faster timesheets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">45%</div>
                <div className="text-sm text-gray-600">Fewer billing errors</div>
              </div>
            </div>

            <button className="px-8 py-3 bg-accent text-white font-semibold rounded-md hover:bg-accent/90 transition-colors">
              Start Your Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

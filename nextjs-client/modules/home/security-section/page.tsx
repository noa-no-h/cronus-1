import Image from 'next/image';
import type { ComponentProps } from 'react';
import PermissionsToggleIcon from '~/components/icons/permissions-toggle';
import SensitiveDataReductionIcon from '~/components/icons/rsensitivedatareduction';
import { cn } from '~/lib/cn';
import { SecurityCard } from './components/SecurityCard';
import GdprLogo from './gdpr-logo.svg';

export default function SecuritySection({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'bg-white text-primary',
        'py-12 tablet:py-20',
        'flex flex-col items-center',
        className
      )}
      {...props}
    >
      <h3 className="font-semibold text-2xl tablet:text-[32px] tracking-[-0.03em] text-center">
        Hardened security
      </h3>

      <div className={cn('mt-12 tablet:mt-20', 'px-4', 'max-w-full')}>
        <ul
          className={cn(
            'flex flex-col tablet:flex-row gap-3 desktop:flex-row',
            'rounded-2xl overflow-hidden'
          )}
        >
          <SecurityCard
            icon={<Image src={GdprLogo} alt="GDPR logo" className="size-full" />}
            title="GDPR Compliant"
            description={
              <div className="block">
                Your data is protected under GDPR. We are committed to your privacy. Read our{' '}
                <a href="https://cronushq.com/privacy" className="text-accent/70 underline">
                  privacy policy.
                </a>
              </div>
            }
            className="border-b-[0.5px] tablet:border-b-0 tablet:border-r-[0.5px] border-neutral-300"
          />
          <SecurityCard
            icon={<SensitiveDataReductionIcon className="size-full text-accent/80" />}
            title="On-Device Data Redaction"
            description="Sensitive information is redacted on your device, so it never reaches our servers."
            className="border-b-[0.5px] tablet:border-b-0 tablet:border-r-[0.5px] border-neutral-300"
          />

          <SecurityCard
            icon={<PermissionsToggleIcon className="size-full text-accent/80" />}
            title="You're in Control"
            description="Enable optional on-device Screen OCR for improved accuracy. The app also works with just window metadata."
          />
        </ul>
      </div>
    </section>
  );
}

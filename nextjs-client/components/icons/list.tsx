import type { ComponentProps } from 'react';

export function List({ className = 'text-icon-muted', ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M7.5 7.25H21M7.5 12.5H21M7.5 17.75H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.75 8C4.16421 8 4.5 7.66421 4.5 7.25C4.5 6.83579 4.16421 6.5 3.75 6.5C3.33579 6.5 3 6.83579 3 7.25C3 7.66421 3.33579 8 3.75 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.75 13.25C4.16421 13.25 4.5 12.9142 4.5 12.5C4.5 12.0858 4.16421 11.75 3.75 11.75C3.33579 11.75 3 12.0858 3 12.5C3 12.9142 3.33579 13.25 3.75 13.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.75 18.5C4.16421 18.5 4.5 18.1642 4.5 17.75C4.5 17.3358 4.16421 17 3.75 17C3.33579 17 3 17.3358 3 17.75C3 18.1642 3.33579 18.5 3.75 18.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

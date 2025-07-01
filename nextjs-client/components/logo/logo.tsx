import type { ComponentProps } from 'react';

export function Logo(props: ComponentProps<'svg'>) {
  return (
    <svg
      width="28"
      height="24"
      viewBox="0 0 28 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16.544 24H0L11.9678 12.0322L0 0H16.544L13.7978 12.0322L16.544 24Z"
        fill="currentColor"
      />
      <path
        opacity="0.2"
        d="M27.6626 24H23.8689L15.041 12.0322L23.8689 0H27.6626L15.6948 12.0322L27.6626 24Z"
        fill="currentColor"
      />
      <path
        opacity="0.55"
        d="M23.8686 24H16.5438L13.7976 12.0322L16.5438 0H23.8686L15.0407 12.0322L23.8686 24Z"
        fill="currentColor"
      />
    </svg>
  );
}

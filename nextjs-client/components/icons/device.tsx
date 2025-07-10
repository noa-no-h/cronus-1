import type { ComponentProps } from 'react';

export function Device(props: ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2 3H22.087V6.8H20.2609V4.9H3.82609V17.25H12.0435V19.15H2V3ZM13.8696 8.7H23V22H13.8696V8.7ZM15.6957 10.6V20.1H21.1739V10.6H15.6957ZM17.5199 17.2481H19.3497V19.1519H17.5199V17.2481ZM5.65217 20.1H12.0435V22H5.65217V20.1Z"
        fill="#B6AECC"
      />
    </svg>
  );
}

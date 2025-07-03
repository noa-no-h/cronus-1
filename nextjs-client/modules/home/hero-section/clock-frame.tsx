import type { ComponentProps } from 'react';

export function ClockFrame(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 1106 1106" fill="none" {...props}>
      <path
        opacity=".32"
        d="M1105 553C1105 248.139 857.861 1 553 1S1 248.139 1 553s247.139 552 552 552v1l-3.576-.01C246.847 1104.07 1.928 859.153.012 556.576L0 553C0 247.586 247.586 0 553 0l3.576.012C860.344 1.935 1106 248.779 1106 553l-.01 3.576C1104.06 860.344 857.221 1106 553 1106v-1c304.861 0 552-247.139 552-552z"
        fill="url(#paint0_linear_454_317)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_454_317"
          x1="1005"
          y1="-83"
          x2="1193.76"
          y2="1065.62"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopOpacity="0" />
          <stop offset=".543" stopColor="#4A505B" stopOpacity=".8" />
          <stop offset="1" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

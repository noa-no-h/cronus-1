import type { ComponentProps } from 'react';

export function Gdpr({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width="104"
      height="104"
      viewBox="0 0 104 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GDPR logo"
      {...props}
    >
      <rect fill="#2050E0" x="0" y="0" width="104" height="104" rx="52" />
      <g transform="translate(52.1217, 52.0811)" fill="#FFCC00" fillRule="nonzero">
        {/* SVG star and badge shapes omitted for brevity, see SVG file for full details */}
      </g>
      <path
        d="M59.8571429,49.0625 L58.7857143,49.0625 L58.7857143,45.828125 C58.7857143,42.0636719 55.7410714,39 52,39 C48.2589286,39 45.2142857,42.0636719 45.2142857,45.828125 L45.2142857,49.0625 L44.1428571,49.0625 C42.9598214,49.0625 42,50.0283203 42,51.21875 L42,59.84375 C42,61.0341797 42.9598214,62 44.1428571,62 L59.8571429,62 C61.0401786,62 62,61.0341797 62,59.84375 L62,51.21875 C62,50.0283203 61.0401786,49.0625 59.8571429,49.0625 Z M55.2142857,49.0625 L48.7857143,49.0625 L48.7857143,45.828125 C48.7857143,44.0447266 50.2276786,42.59375 52,42.59375 C53.7723214,42.59375 55.2142857,44.0447266 55.2142857,45.828125 L55.2142857,49.0625 Z"
        fill="#FFFFFF"
        fillRule="nonzero"
      />
    </svg>
  );
}

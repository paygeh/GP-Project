import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function ScissorsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <path d="M8.1 7.5 20 18M8.1 16.5 20 6M11 12l-3 1" />
    </svg>
  );
}

export function DryerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9a6 6 0 0 1 6-6h4a5 5 0 0 1 0 10H9a6 6 0 0 1-6-6Z" />
      <path d="M9 13l1 7M9 8h.01M12 8h.01" />
      <path d="M19 7v4" />
    </svg>
  );
}

export function BrushIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20c2-1 2.5-3 4-4" />
      <rect x="12" y="3" width="7" height="5" rx="2.5" transform="rotate(45 15.5 5.5)" />
      <path d="M8.5 11.5 15 5" />
      <path d="M7 13c1.6.4 2.6 1.4 3 3" />
    </svg>
  );
}

export function DropletIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3s6 6.4 6 10.5A6 6 0 0 1 6 13.5C6 9.4 12 3 12 3Z" />
      <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7Z" />
      <path d="M19 4.5v3M20.5 6h-3" />
    </svg>
  );
}

export function CrownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8l3 3 5-6 5 6 3-3-1.5 11H5.5L4 8Z" />
      <path d="M6.5 20h11" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

// Round-robin set used to decorate services that have no explicit icon.
export const SERVICE_ICONS = [
  ScissorsIcon,
  DropletIcon,
  DryerIcon,
  BrushIcon,
  SparkleIcon,
  CrownIcon,
];

export function serviceIcon(index: number) {
  return SERVICE_ICONS[index % SERVICE_ICONS.length];
}

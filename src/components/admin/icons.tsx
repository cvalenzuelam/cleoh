import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconGrid(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.3" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.3" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.3" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.3" />
    </Svg>
  );
}

export function IconChartBar(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 4v16h16" />
      <path d="M8 16.5v-3.5" />
      <path d="M12.5 16.5V10" />
      <path d="M17 16.5V7" />
    </Svg>
  );
}

export function IconTag(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12.3 3h5.7a1 1 0 0 1 1 1v5.7a1 1 0 0 1-.3.7l-8 8a1 1 0 0 1-1.4 0l-6.7-6.7a1 1 0 0 1 0-1.4l8-8a1 1 0 0 1 .7-.3Z" />
      <circle cx="16.3" cy="7.7" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconReceipt(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3Z" />
      <path d="M9 7.5h6" />
      <path d="M9 11h6" />
      <path d="M9 14.5h3.5" />
    </Svg>
  );
}

export function IconTicket(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
      <circle cx="9" cy="15" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="0.8" fill="currentColor" stroke="none" />
      <path d="M9 15 15 9" />
    </Svg>
  );
}

export function IconLayers(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 21 8l-9 5-9-5Z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 16l9 5 9-5" />
    </Svg>
  );
}

export function IconImage(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="8.7" cy="9.5" r="1.6" />
      <path d="M4 16.7l4.6-4.6a1.5 1.5 0 0 1 2.12 0l3.28 3.28a1.5 1.5 0 0 0 2.12 0l1.7-1.7 2.3 2.3" />
    </Svg>
  );
}

export function IconTruck(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="7" width="11" height="9" rx="1" />
      <path d="M13.5 10h3.3l3 3.4V16h-6.3Z" />
      <circle cx="7" cy="18.3" r="1.6" />
      <circle cx="16.6" cy="18.3" r="1.6" />
    </Svg>
  );
}

export function IconTrophy(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 5.2H5.3a2 2 0 0 0 0 4H7" />
      <path d="M16 5.2h2.7a2 2 0 0 1 0 4H17" />
      <path d="M12 13v3.5" />
      <path d="M9.7 20h4.6l-.7-3.5h-3.2Z" />
    </Svg>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <ellipse cx="12" cy="12" rx="3.6" ry="8.5" />
      <path d="M4 9.3h16" />
      <path d="M4 14.7h16" />
    </Svg>
  );
}

export function IconBanknote(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 9v0" />
      <path d="M18 15v0" />
    </Svg>
  );
}

export function IconListChecks(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.2" y="4.8" width="3" height="3" rx="0.6" />
      <path d="M9 6.3h11.5" />
      <rect x="3.2" y="10.5" width="3" height="3" rx="0.6" />
      <path d="M9 12h11.5" />
      <rect x="3.2" y="16.2" width="3" height="3" rx="0.6" />
      <path d="M9 17.7h11.5" />
    </Svg>
  );
}

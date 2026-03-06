type IconProps = { size?: number; className?: string; color?: string; style?: React.CSSProperties };

const base = (size: number, className?: string) => ({
  width: size, height: size, viewBox: "0 0 24 24",
  fill: "none", stroke: "currentColor", strokeWidth: 1.6,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  className,
});

export function IconSyringe({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M18 2l4 4" />
      <path d="M14.5 5.5l4 4" />
      <path d="M11 7l6 6" />
      <path d="M6.8 11.8L3 21l4-1 9.2-9.2" />
      <path d="M9 14l-5 5" />
      <path d="M14 9l2-2" />
    </svg>
  );
}

export function IconDroplet({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </svg>
  );
}

export function IconActivity({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function IconHome({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function IconZap({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function IconShieldCheck({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function IconClock({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function IconMapPin({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconStar({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function IconCreditCard({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

export function IconUsers({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function IconStethoscope({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 100 .3" />
      <path d="M8 15v1a6 6 0 006 6h0a6 6 0 006-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}

export function IconClipboard({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

export function IconNavigation({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

export function IconTruck({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function IconMedic({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export function IconSun({ size = 20, className, style }: IconProps) {
  return (
    <svg {...base(size, className)} style={style}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function IconMoon({ size = 20, className, style }: IconProps) {
  return (
    <svg {...base(size, className)} style={style}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

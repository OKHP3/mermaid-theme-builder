interface AppIconProps {
  size?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
}

export function AppIcon({ size = 32, className, ...ariaProps }: AppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      {...ariaProps}
    >
      <rect width="100" height="100" rx="18" fill="#111827" />
      <rect x="29" y="9" width="42" height="16" rx="4" fill="#e5e7eb" />
      <path
        d="M 50 25 L 50 55 M 50 55 L 23 71 M 50 55 L 77 71"
        stroke="#c46a2c"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <rect x="4" y="71" width="38" height="16" rx="4" fill="#e5e7eb" />
      <rect x="58" y="71" width="38" height="16" rx="4" fill="#c46a2c" />
    </svg>
  );
}

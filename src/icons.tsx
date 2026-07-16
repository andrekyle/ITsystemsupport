import type { SVGProps } from "react";

/** Thin, Fluent-style stroke icons. All strokes 1.1, currentColor. */
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} {...base} {...rest} aria-hidden="true">
      {children}
    </svg>
  );
}

export const PATHS: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 4.5l8 7" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10 19.5v-5h4v5" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" />
      <path d="M9 7h6" />
    </>
  ),
  certificate: (
    <>
      <rect x="3.5" y="4.5" width="17" height="13" rx="1.5" />
      <path d="M7 8.5h10M7 11.5h6" />
      <circle cx="16.5" cy="14.5" r="2.2" />
      <path d="M15.5 16.4v3.1l1-0.8 1 0.8v-3.1" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v16h16" />
      <path d="M8 16v-5M12 16V8M16 16v-3" />
    </>
  ),
  trend: (
    <>
      <path d="M4 18 10 12l3 3 7-7" />
      <path d="M15.5 8H20v4.5" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5.5" y="4.5" width="13" height="16" rx="1.5" />
      <path d="M9 4.5V3.5h6v1" />
      <path d="M8.5 10l2 2 4-4.5M8.5 16.5h7" />
    </>
  ),
  checklist: (
    <>
      <path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" />
      <path d="M11 6.5h9M11 12.5h9M11 18.5h9" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="1.5" />
      <path d="M4 9.5h16M8 3v4M16 3v4" />
      <path d="M8 13.5h2M14 13.5h2M8 16.5h2" />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 6A1.5 1.5 0 0 1 5 4.5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 8.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z" />
    </>
  ),
  document: (
    <>
      <path d="M6 3.5h8l4 4V20.5H6z" />
      <path d="M14 3.5v4h4" />
      <path d="M9 12h6M9 15h6M9 18h4" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20.5c0-3.6 3-6 7-6s7 2.4 7 6" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19.5c0-3 2.4-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="8.5" r="2.4" />
      <path d="M16.5 14.2c2.4.3 4 2 4 4.5" />
    </>
  ),
  signout: (
    <>
      <path d="M13 4.5H6.5v15H13" />
      <path d="M16 8.5l4 3.5-4 3.5M20 12H10" />
    </>
  ),
  chevronLeft: <path d="M14.5 6 9 12l5.5 6" />,
  chevronRight: <path d="M9.5 6 15 12l-5.5 6" />,
  chevronDown: <path d="M6 9.5l6 5.5 6-5.5" />,
  arrowLeft: <path d="M10 5.5 3.9 12l6.1 6.5M4 12h16" />,
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  panel: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M9.5 4.5v15" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5.5 5.5" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.2l2.6 2.6 5-5.6" />
    </>
  ),
  circle: <circle cx="12" cy="12" r="8.5" />,
  halfCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" opacity="0.35" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10 8.8v6.4l5.2-3.2z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.6-3 7.7-7 9-4-1.3-7-4.4-7-9V6z" />
      <path d="M9 11.8l2.2 2.2 4-4.5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
      <path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13" />
      <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </>
  ),
  network: (
    <>
      <rect x="9" y="3.5" width="6" height="5" rx="1" />
      <rect x="3" y="15.5" width="6" height="5" rx="1" />
      <rect x="15" y="15.5" width="6" height="5" rx="1" />
      <path d="M12 8.5V12M12 12H6v3.5M12 12h6v3.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c-2.5 2.3-3.8 5.2-3.8 8.5s1.3 6.2 3.8 8.5c2.5-2.3 3.8-5.2 3.8-8.5S14.5 5.8 12 3.5z" />
    </>
  ),
  server: (
    <>
      <rect x="4" y="4" width="16" height="6.5" rx="1.2" />
      <rect x="4" y="13.5" width="16" height="6.5" rx="1.2" />
      <path d="M7.2 7.2h.01M7.2 16.7h.01" strokeWidth="2" />
      <path d="M11 7.2h6M11 16.7h6" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  design: (
    <>
      <path d="M4 20l1-4L16.5 4.5a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L8 19z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  presenter: (
    <>
      <rect x="3.5" y="4" width="17" height="11" rx="1.2" />
      <path d="M12 15v2.5M8.5 20.5 12 17.5l3.5 3" />
      <path d="M7 8h6M7 11h4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9.5" r="5.5" />
      <path d="M9 14.2 7.5 21l4.5-2.4L16.5 21 15 14.2" />
      <path d="M12 7l.9 1.8 2 .3-1.4 1.4.3 2L12 11.6l-1.8.9.3-2-1.4-1.4 2-.3z" strokeWidth="1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" strokeWidth="1.6" />
    </>
  ),
  filter: <path d="M4 5.5h16l-6.2 7v5.5l-3.6 2v-7.5z" />,
  bell: (
    <>
      <path d="M6 16.5v-6a6 6 0 0 1 12 0v6l1.5 2h-15z" />
      <path d="M10.3 20.5a1.8 1.8 0 0 0 3.4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
    </>
  ),
  moon: <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
    </>
  ),
  monitor: (
    <>
      <rect x="3.5" y="4.5" width="17" height="11.5" rx="1.2" />
      <path d="M12 16v3M8.5 19.5h7" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="1.5" />
      <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12h17M12 10.8v2.4" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5.5h16v11H10l-4 3.5v-3.5H4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  chip: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.2" />
      <rect x="10" y="10" width="4" height="4" />
      <path d="M9.5 7V4M14.5 7V4M9.5 20v-3M14.5 20v-3M7 9.5H4M7 14.5H4M20 9.5h-3M20 14.5h-3" />
    </>
  ),
  gradcap: (
    <>
      <path d="M12 4.5 21.5 9 12 13.5 2.5 9z" />
      <path d="M6.5 11.2v4.3c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.3" />
      <path d="M21.5 9v5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5 21 8l-9 4.5L3 8z" />
      <path d="M4.6 11.7 3 12.5l9 4.5 9-4.5-1.6-.8M4.6 15.7 3 16.5l9 4.5 9-4.5-1.6-.8" />
    </>
  ),
  exercise: (
    <>
      <rect x="3.5" y="3.5" width="12" height="17" rx="1.5" />
      <path d="M6.8 8h5.4M6.8 11.5h5.4M6.8 15h3.2" />
      <path d="M20.8 8.1a1.5 1.5 0 0 0-2.1-2.1l-6.2 6.2-.9 3 3-.9z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4 16.5v2.5A1.5 1.5 0 0 0 5.5 20.5h13a1.5 1.5 0 0 0 1.5-1.5v-2.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4.5 5.5C3 7 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.4-.6 4.7-1.4M9.5 5.9A9.5 9.5 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.3 3.1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M4 4l16 16" />
    </>
  ),
};

export function Icon({ name, size = 20, ...rest }: { name: string } & P) {
  return (
    <Svg size={size} {...rest}>
      {PATHS[name] ?? PATHS.circle}
    </Svg>
  );
}

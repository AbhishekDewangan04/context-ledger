import type { SVGProps } from "react";
import type { ReactNode } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Glyph({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="1em"
      height="1em"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </Glyph>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m4 12.5 5 5L20 6.5" />
    </Glyph>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </Glyph>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Glyph>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 4v11" />
      <path d="m7 12 5 5 5-5" />
      <path d="M5 20h14" />
    </Glyph>
  );
}

export function NodesIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M8 6h8M7 8l4 8M17 8l-4 8" />
    </Glyph>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18l4-6" />
    </Glyph>
  );
}

export function HandoffIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 7h16M4 12h10M4 17h7" />
      <path d="m17 13 4 3-4 3z" />
    </Glyph>
  );
}

export function TerminalIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 10 2 2-2 2" />
      <path d="M12 14h5" />
    </Glyph>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M12 3v4M12 17v4M4 12h4M16 12h4M6.6 6.6l2.8 2.8M14.6 14.6l2.8 2.8M17.4 6.6l-2.8 2.8M9.4 14.6l-2.8 2.8" />
    </Glyph>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </Glyph>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Glyph>
  );
}

export function WrenchIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </Glyph>
  );
}

export function SignalBarsIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 18v-2M9 18v-6M14 18V8M19 18V4" strokeWidth={2} />
    </Glyph>
  );
}

export function UserAgentIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </Glyph>
  );
}
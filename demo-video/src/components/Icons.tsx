import { COLOR } from '../theme';

type IconProps = { size?: number; color?: string };

export const CheckIcon: React.FC<IconProps> = ({ size = 28, color = COLOR.teal }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
    <circle cx="14" cy="14" r="13" fill={color} />
    <path d="M8 14.5l4 4 8-9" stroke={COLOR.white} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrossIcon: React.FC<IconProps> = ({ size = 28, color = COLOR.red }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
    <circle cx="14" cy="14" r="13" fill={color} />
    <path d="M9.5 9.5l9 9M18.5 9.5l-9 9" stroke={COLOR.white} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const HalfIcon: React.FC<IconProps> = ({ size = 28, color = COLOR.amber }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
    <circle cx="14" cy="14" r="12" fill={COLOR.white} stroke={color} strokeWidth="3" />
    <path d="M14 2a12 12 0 0 1 0 24z" fill={color} />
  </svg>
);

export const PendingIcon: React.FC<IconProps> = ({ size = 28, color = COLOR.muted }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
    <circle cx="14" cy="14" r="12" fill="none" stroke={color} strokeWidth="3" strokeDasharray="4 4" />
  </svg>
);

/** Horizontal arrow. Font subsets lack U+2192, so arrows are drawn. */
export const ArrowRight: React.FC<{ width?: number; color?: string; stroke?: number }> = ({ width = 48, color = COLOR.ink, stroke = 3 }) => (
  <svg width={width} height={20} viewBox={`0 0 ${width} 20`} aria-hidden style={{ flex: 'none' }}>
    <path d={`M2 10H${width - 6}`} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    <path d={`M${width - 14} 3l9 7-9 7`} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowDown: React.FC<{ height?: number; color?: string; stroke?: number }> = ({ height = 36, color = COLOR.ink, stroke = 3 }) => (
  <svg width={20} height={height} viewBox={`0 0 20 ${height}`} aria-hidden>
    <path d={`M10 2V${height - 6}`} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    <path d={`M3 ${height - 14}l7 9 7-9`} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Checkbox: React.FC<{ size?: number; checked?: boolean }> = ({ size = 24, checked = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flex: 'none' }}>
    <rect x="1.5" y="1.5" width="21" height="21" rx="3" fill={COLOR.white} stroke={COLOR.ink} strokeWidth="2.5" />
    {checked && <path d="M6 12.5l4 4 8-9" stroke={COLOR.teal} strokeWidth="3" fill="none" strokeLinecap="round" />}
  </svg>
);

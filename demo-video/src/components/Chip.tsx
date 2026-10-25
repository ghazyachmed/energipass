import { COLOR, FONT } from '../theme';

export type ChipKind = 'simulated' | 'concept' | 'planned' | 'evidence' | 'future' | 'proposed';

const STYLE: Record<ChipKind, { label: string; css: React.CSSProperties }> = {
  simulated: { label: 'Simulated Data', css: { background: COLOR.amberSoft, color: COLOR.amber, border: `2px solid ${COLOR.amber}` } },
  concept: { label: 'Concept Simulation', css: { background: COLOR.white, color: COLOR.ink, border: `2px solid ${COLOR.ink}` } },
  planned: { label: 'Planned Feature', css: { background: COLOR.white, color: COLOR.teal, border: `2px dashed ${COLOR.teal}` } },
  evidence: { label: 'Industry Evidence', css: { background: COLOR.tealSoft, color: COLOR.teal, border: `2px solid ${COLOR.teal}` } },
  future: { label: 'Future Validation', css: { background: COLOR.white, color: COLOR.inkSoft, border: `2px dashed ${COLOR.inkSoft}` } },
  proposed: { label: 'Proposed Product', css: { background: COLOR.ink, color: COLOR.white, border: `2px solid ${COLOR.ink}` } },
};

export const Chip: React.FC<{ kind: ChipKind; label?: string; size?: number; style?: React.CSSProperties }> = ({ kind, label, size = 18, style }) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center', fontFamily: FONT.mono, fontWeight: 500, fontSize: size,
      letterSpacing: '0.08em', textTransform: 'uppercase', padding: `${Math.round(size * 0.35)}px ${Math.round(size * 0.7)}px`,
      borderRadius: 4, whiteSpace: 'nowrap', lineHeight: 1, ...STYLE[kind].css, ...style,
    }}
  >
    {label ?? STYLE[kind].label}
  </span>
);

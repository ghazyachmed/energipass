import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { rise, sceneOpacity } from '../anim';
import { COLOR, FONT, LAYOUT } from '../theme';
import { Chip, ChipKind } from './Chip';

type Props = {
  index: number;
  label: string;
  headline: React.ReactNode;
  headlineStart?: number;
  chips?: ChipKind[];
  chipsStart?: number;
  durationInFrames: number;
  children: React.ReactNode;
};

/** Shared scene layout: graph-paper ground, step counter, headline, label chips. */
export const SceneFrame: React.FC<Props> = ({ index, label, headline, headlineStart = 4, chips = [], chipsStart = 10, durationInFrames, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, durationInFrames) }}>
      <div style={{ position: 'absolute', left: LAYOUT.marginX, right: LAYOUT.marginX, top: 54, minHeight: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 22, color: COLOR.muted, letterSpacing: '0.08em', textTransform: 'uppercase', ...rise(frame, 0, 10, 12) }}>
          <span style={{ color: COLOR.teal, fontWeight: 500 }}>{String(index).padStart(2, '0')}</span> / 06 · {label}
        </div>
        <div style={{ display: 'flex', gap: 12, ...rise(frame, chipsStart, 10, 12) }}>
          {chips.map((kind) => <Chip key={kind} kind={kind} />)}
        </div>
      </div>
      <div
        style={{
          position: 'absolute', left: LAYOUT.marginX, top: 104, maxWidth: 1500, fontFamily: FONT.display, fontWeight: 700,
          fontSize: 60, lineHeight: 1.08, color: COLOR.ink, letterSpacing: '-0.01em', ...rise(frame, headlineStart, 24, 18),
        }}
      >
        {headline}
      </div>
      {children}
    </AbsoluteFill>
  );
};

/** Graph-paper ground shared by every scene (static, outside scene fades). */
export const PaperGround: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: COLOR.paper,
      backgroundImage: [
        `linear-gradient(${COLOR.gridMajor} 1px, transparent 1px)`,
        `linear-gradient(90deg, ${COLOR.gridMajor} 1px, transparent 1px)`,
        `linear-gradient(${COLOR.grid} 1px, transparent 1px)`,
        `linear-gradient(90deg, ${COLOR.grid} 1px, transparent 1px)`,
      ].join(', '),
      backgroundSize: '200px 200px, 200px 200px, 40px 40px, 40px 40px',
      backgroundPosition: '-1px -1px',
    }}
  />
);

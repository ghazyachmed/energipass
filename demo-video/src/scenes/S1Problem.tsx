import { useCurrentFrame } from 'remotion';
import { progress, rise, slideIn } from '../anim';
import { Chip } from '../components/Chip';
import { Compressor } from '../components/Compressor';
import { ArrowDown, Checkbox } from '../components/Icons';
import { SceneFrame } from '../components/SceneFrame';
import { COLOR, FONT } from '../theme';
import { cueFrame } from '../timing';

const REPORT_ROWS: Array<[string, string, boolean]> = [
  ['System', 'Compressed air, 1 screw compressor', false],
  ['Observation', 'Air leaks along the distribution header', false],
  ['Recommendation', 'Repair leaks, tune compressor control', true],
  ['Expected result', 'Lower electricity use, not yet quantified', false],
];

export const S1Problem: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const reportAt = cueFrame('problem', 0) + 12;
  const gateAt = cueFrame('problem', 1);
  const evidenceAt = cueFrame('problem', 2);
  const highlight = progress(frame, reportAt + 50, 14);
  const pulse = 1 + 0.06 * Math.max(0, Math.sin((frame - gateAt) / 6)) * progress(frame, gateAt + 20, 10);

  return (
    <SceneFrame
      index={1}
      label="Problem"
      durationInFrames={durationInFrames}
      headline={<>An energy audit finds an opportunity.<br />What about the investment decision?</>}
      chips={['simulated']}
    >
      <div style={{ position: 'absolute', left: 96, top: 300, ...rise(frame, 6, 30, 22) }}>
        <Compressor frame={frame} width={780} />
      </div>

      {/* Audit report (simulated), then the open decision */}
      <div style={{ position: 'absolute', left: 980, top: 292, width: 830, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ width: '100%', background: COLOR.white, border: `2px solid ${COLOR.ink}`, borderRadius: 6, padding: '18px 26px', ...slideIn(frame, reportAt, 70, 22) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 19, letterSpacing: '0.08em', color: COLOR.muted }}>ENERGY AUDIT REPORT · FINDING 03</span>
            <Chip kind="simulated" size={15} />
          </div>
          {REPORT_ROWS.map(([label, text, isKey], index) => (
            <div
              key={label}
              style={{
                display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14, alignItems: 'baseline', padding: '8px 12px', borderTop: `1px solid ${COLOR.line}`,
                background: isKey ? `rgba(14, 116, 104, ${0.14 * highlight})` : 'transparent', ...rise(frame, reportAt + 10 + index * 7, 12, 12),
              }}
            >
              <span style={{ fontFamily: FONT.mono, fontSize: 17, color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              <span style={{ fontFamily: FONT.body, fontSize: 25, lineHeight: 1.4, color: COLOR.ink, fontWeight: isKey ? 600 : 400 }}>{text}</span>
            </div>
          ))}
        </div>
        <div style={{ ...rise(frame, gateAt, 10, 10) }}>
          <ArrowDown height={36} color={COLOR.ink} />
        </div>
        <div
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 24, background: COLOR.paperDeep, border: `2px dashed ${COLOR.ink}`,
            borderRadius: 6, padding: '16px 26px', ...rise(frame, gateAt + 6, 20, 16),
          }}
        >
          <div
            style={{
              width: 68, height: 68, borderRadius: '50%', background: COLOR.ink, color: COLOR.white, display: 'grid', placeItems: 'center',
              fontFamily: FONT.display, fontWeight: 700, fontSize: 46, transform: `scale(${pulse})`, flex: 'none',
            }}
          >
            ?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 32, color: COLOR.ink }}>Investment decision</span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: FONT.body, fontSize: 24, color: COLOR.inkSoft }}><Checkbox /> Approve</span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: FONT.body, fontSize: 24, color: COLOR.inkSoft }}><Checkbox /> Defer</span>
            </span>
            <span style={{ fontFamily: FONT.body, fontSize: 22, color: COLOR.muted }}>Costs, savings, and evidence are not prepared yet.</span>
          </div>
        </div>
      </div>

      {/* Observed industry evidence with source */}
      <div style={{ position: 'absolute', left: 110, top: 806, display: 'flex', gap: 16, alignItems: 'flex-start', ...rise(frame, evidenceAt, 12, 14) }}>
        <Chip kind="evidence" size={15} style={{ marginTop: 3 }} />
        <div style={{ fontFamily: FONT.body, fontSize: 23, color: COLOR.inkSoft, lineHeight: 1.3 }}>
          In a U.S. study of audited plants, about half of the recommended efficiency projects were adopted.
          <div style={{ fontFamily: FONT.mono, fontSize: 17, color: COLOR.muted, marginTop: 2 }}>Source: Anderson &amp; Newell (2004), Resource and Energy Economics 26(1), 27-50.</div>
        </div>
      </div>
    </SceneFrame>
  );
};

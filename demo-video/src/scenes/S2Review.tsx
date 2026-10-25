import { useCurrentFrame } from 'remotion';
import { mix, progress, rise, slideIn } from '../anim';
import { Chip } from '../components/Chip';
import { CheckIcon } from '../components/Icons';
import { SceneFrame } from '../components/SceneFrame';
import { CASE, num, rp } from '../data/compressorCase';
import { COLOR, FONT } from '../theme';
import { cueFrame } from '../timing';

type Field = { label: string; value: string; source: string; kind: 'Measured' | 'Document' | 'Estimate' | 'Linked'; sentence: string };

const FIELDS: Field[] = [
  { label: 'Baseline power', value: `${CASE.baselinePowerKw} kW`, kind: 'Measured', source: 'Power logger, 7 days', sentence: `Average input power measured at ${CASE.baselinePowerKw} kW.` },
  { label: 'Operating hours', value: `${num(CASE.operatingHoursPerYear)} h/year`, kind: 'Document', source: 'Production schedule', sentence: `Compressor runs ${num(CASE.operatingHoursPerYear)} hours per year.` },
  { label: 'Electricity tariff', value: `${rp(CASE.tariffRpPerKwh)}/kWh`, kind: 'Document', source: 'Energy bill average', sentence: `Average tariff ${rp(CASE.tariffRpPerKwh)}/kWh.` },
  { label: 'Investment cost', value: rp(CASE.investmentRp), kind: 'Estimate', source: 'Budget estimate', sentence: `Leak repair and control tuning: ${rp(CASE.investmentRp)}.` },
  { label: 'Evidence source', value: '3 files linked', kind: 'Linked', source: 'Logger, bill, estimate', sentence: 'Attachments: logger export, bill, estimate.' },
];

const KIND_COLOR: Record<Field['kind'], string> = { Measured: COLOR.teal, Document: COLOR.inkSoft, Estimate: COLOR.amber, Linked: COLOR.inkSoft };

const DOC = { left: 110, top: 292, width: 640, lineTop: 420, lineGap: 84 };
const PANEL = { left: 880, top: 292, width: 930, rowTop: 390, rowGap: 84 };
const TRAVEL = 20;

export const S2Review: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const c0 = cueFrame('review', 0);
  const c1 = cueFrame('review', 1);
  const c2 = cueFrame('review', 2);
  const starts = [c0 + 12, c0 + 34, c0 + 56, c1 + 6, c1 + 52];

  return (
    <SceneFrame index={2} label="Review" durationInFrames={durationInFrames} headline="Technical data needs review before a decision" chips={['concept', 'simulated']}>
      {/* Audit finding document */}
      <div style={{ position: 'absolute', left: DOC.left, top: DOC.top, width: DOC.width, height: 560, background: COLOR.white, border: `2px solid ${COLOR.ink}`, borderRadius: 6, padding: '22px 26px', ...rise(frame, 4, 24, 18) }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 19, letterSpacing: '0.08em', color: COLOR.muted }}>AUDIT FINDING · COMPRESSOR ROOM</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 32, color: COLOR.ink, marginTop: 8 }}>Field notes (simulated)</div>
      </div>
      {FIELDS.map((field, index) => {
        const lit = progress(frame, starts[index] - 6, 8);
        return (
          <div key={field.label} style={{ position: 'absolute', left: DOC.left + 26, top: DOC.lineTop + index * DOC.lineGap - 16, width: DOC.width - 52, ...rise(frame, 10 + index * 4, 10, 12) }}>
            <div style={{ fontFamily: FONT.body, fontSize: 25, lineHeight: 1.3, color: COLOR.ink, padding: '8px 10px', borderLeft: `4px solid ${lit > 0 ? COLOR.teal : COLOR.line}`, background: `rgba(14, 116, 104, ${0.12 * lit})` }}>
              {field.sentence}
            </div>
          </div>
        );
      })}

      {/* Concept input panel */}
      <div style={{ position: 'absolute', left: PANEL.left, top: PANEL.top, width: PANEL.width, height: 560, background: COLOR.white, border: `2px solid ${COLOR.ink}`, borderRadius: 6, overflow: 'hidden', ...slideIn(frame, 12, 60, 20) }}>
        <div style={{ height: 64, background: COLOR.ink, color: COLOR.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 28 }}>EnergiAction Bankable · Input review</span>
          <Chip kind="concept" size={14} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '250px 300px 1fr', padding: '14px 24px 0', fontFamily: FONT.mono, fontSize: 16, color: COLOR.muted, letterSpacing: '0.06em' }}>
          <span>INPUT</span><span>VALUE</span><span>SOURCE</span>
        </div>
      </div>
      {FIELDS.map((field, index) => {
        const filled = progress(frame, starts[index] + TRAVEL, 10);
        const rowTop = PANEL.rowTop + index * PANEL.rowGap;
        return (
          <div key={field.label} style={{ position: 'absolute', left: PANEL.left + 2, top: rowTop, width: PANEL.width - 4, height: 72, display: 'grid', gridTemplateColumns: '250px 300px 1fr', alignItems: 'center', padding: '0 22px', borderTop: `1px solid ${COLOR.line}`, opacity: progress(frame, 16, 12) }}>
            <span style={{ fontFamily: FONT.body, fontSize: 25, color: COLOR.inkSoft }}>{field.label}</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 500, color: COLOR.ink, opacity: filled }}>{field.value}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: filled }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 16, color: COLOR.white, background: KIND_COLOR[field.kind], padding: '5px 9px', borderRadius: 3, letterSpacing: '0.05em' }}>{field.kind.toUpperCase()}</span>
              <span style={{ fontFamily: FONT.body, fontSize: 21, color: COLOR.muted }}>{field.source}</span>
            </span>
          </div>
        );
      })}

      {/* Moving field tokens from the document to the panel */}
      {FIELDS.map((field, index) => {
        const p = progress(frame, starts[index], TRAVEL);
        if (p <= 0 || p >= 1) return null;
        const x = mix(DOC.left + DOC.width - 230, PANEL.left + 272, p);
        const y = mix(DOC.lineTop + index * DOC.lineGap - 8, PANEL.rowTop + index * PANEL.rowGap + 14, p);
        return (
          <div key={field.label} style={{ position: 'absolute', left: x, top: y, fontFamily: FONT.mono, fontSize: 20, color: COLOR.white, background: COLOR.teal, padding: '7px 12px', borderRadius: 4, boxShadow: '0 4px 14px rgba(16,33,43,0.18)' }}>
            {field.label}
          </div>
        );
      })}

      <div style={{ position: 'absolute', left: PANEL.left + 24, top: 808, display: 'flex', alignItems: 'center', gap: 14, ...rise(frame, c2, 12, 14) }}>
        <CheckIcon size={30} />
        <span style={{ fontFamily: FONT.body, fontSize: 26, color: COLOR.ink }}>
          <strong>5 of 5 inputs</strong> have a recorded source. Ready for engineer review.
        </span>
      </div>
    </SceneFrame>
  );
};

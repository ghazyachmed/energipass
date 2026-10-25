import { useCurrentFrame } from 'remotion';
import { progress, rise, slideIn } from '../anim';
import { Chip } from '../components/Chip';
import { ArrowDown, CheckIcon, CrossIcon, HalfIcon, PendingIcon } from '../components/Icons';
import { SceneFrame } from '../components/SceneFrame';
import { CASE, rp } from '../data/compressorCase';
import { COLOR, FONT } from '../theme';
import { cueFrame } from '../timing';

const AI_STEPS = [
  'Audit report text',
  'AI proposes fields with source quotes',
  'Engineer validates each field',
  'Deterministic calculation',
];

export const S5Evidence: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const c0 = cueFrame('evidence', 0);
  const c1 = cueFrame('evidence', 1);
  const c2 = cueFrame('evidence', 2);
  const reviewed = progress(frame, c2 + 24, 10) >= 1;
  const validateFocus = progress(frame, c2, 12);

  const rows = [
    { category: 'Measured data', item: `Baseline power ${CASE.baselinePowerKw} kW`, note: 'Power logger export, 7 days', icon: <CheckIcon />, status: 'Measured', color: COLOR.teal },
    { category: 'Assumption', item: `After-repair power ${CASE.afterRepairPowerKw} kW`, note: 'Estimate from leak survey notes. Shown in the brief.', icon: <HalfIcon />, status: 'Assumption', color: COLOR.amber },
    { category: 'Missing evidence', item: `Vendor quotation for ${rp(CASE.investmentRp)}`, note: 'Budget estimate only. Quotation not yet received.', icon: <CrossIcon />, status: 'Missing', color: COLOR.red },
    { category: 'Engineering review', item: 'Inputs, formulas, and sources', note: reviewed ? 'Checked by engineer before use' : 'Waiting for engineer check', icon: reviewed ? <CheckIcon /> : <PendingIcon />, status: reviewed ? 'Reviewed' : 'Pending', color: reviewed ? COLOR.teal : COLOR.muted },
  ];

  return (
    <SceneFrame index={5} label="Evidence" durationInFrames={durationInFrames} headline="Engineers still verify" chips={['concept', 'simulated']}>
      {/* Evidence register */}
      <div style={{ position: 'absolute', left: 110, top: 262, width: 960, height: 608, background: COLOR.white, border: `2px solid ${COLOR.ink}`, borderRadius: 6, overflow: 'hidden', ...rise(frame, 4, 24, 18) }}>
        <div style={{ height: 60, background: COLOR.ink, color: COLOR.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 28 }}>Evidence register</span>
          <Chip kind="concept" size={14} />
        </div>
        {rows.map((row, index) => (
          <div key={row.category} style={{ display: 'grid', gridTemplateColumns: '44px 1fr 190px', gap: 18, alignItems: 'center', padding: '18px 24px', borderTop: index ? `1px solid ${COLOR.line}` : 'none', minHeight: 136, ...rise(frame, c0 + 8 + index * 22, 14, 14) }}>
            {row.icon}
            <div>
              <div style={{ fontFamily: FONT.mono, fontSize: 17, letterSpacing: '0.08em', color: COLOR.muted, textTransform: 'uppercase' }}>{row.category}</div>
              <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 28, color: COLOR.ink, marginTop: 2 }}>{row.item}</div>
              <div style={{ fontFamily: FONT.body, fontSize: 22, color: COLOR.inkSoft, marginTop: 2 }}>{row.note}</div>
            </div>
            <span style={{ justifySelf: 'end', fontFamily: FONT.mono, fontSize: 18, fontWeight: 500, color: COLOR.white, background: row.color, padding: '7px 12px', borderRadius: 4, letterSpacing: '0.05em' }}>{row.status.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Planned AI module, kept visually separate */}
      <div style={{ position: 'absolute', left: 1120, top: 262, width: 690, height: 608, border: `3px dashed ${COLOR.teal}`, borderRadius: 8, padding: '22px 28px', background: 'rgba(255,255,255,0.6)', ...slideIn(frame, c1, 50, 20) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 32, color: COLOR.ink }}>AI Module</span>
          <Chip kind="planned" size={16} />
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 22, color: COLOR.muted, marginTop: 4 }}>Not active in the current demo</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 18 }}>
          {AI_STEPS.map((step, index) => {
            const isEngineer = index === 2;
            const focus = isEngineer ? validateFocus : 0;
            return (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, ...rise(frame, c1 + 14 + index * 16, 10, 12) }}>
                {index > 0 && <ArrowDown height={30} color={COLOR.inkSoft} />}
                <div style={{ width: 560, padding: '14px 18px', borderRadius: 4, textAlign: 'center', fontFamily: FONT.body, fontSize: 25, fontWeight: isEngineer ? 600 : 400, color: focus > 0.5 ? COLOR.white : COLOR.ink, background: focus > 0.5 ? COLOR.teal : COLOR.white, border: `2px ${index === 1 ? 'dashed' : 'solid'} ${isEngineer ? COLOR.teal : COLOR.ink}`, transform: `scale(${1 + 0.04 * focus})` }}>
                  {step}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 21, color: COLOR.inkSoft, marginTop: 16, textAlign: 'center', ...rise(frame, c1 + 80, 8, 12) }}>
          AI does not calculate savings or payback.
        </div>
      </div>
    </SceneFrame>
  );
};

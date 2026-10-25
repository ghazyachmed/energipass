import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { progress, rise, slideIn } from '../anim';
import { Chip } from '../components/Chip';
import { ArrowRight, Checkbox } from '../components/Icons';
import { SceneFrame } from '../components/SceneFrame';
import { CASE, baselineEnergyKwh, netSavingsRp, num, paybackYears, powerReductionPct, rp, savingsKwh } from '../data/compressorCase';
import { COLOR, FONT } from '../theme';
import { cueFrame } from '../timing';

const FLOW = ['Audit', 'Evidence', 'Investment Decision'];

export const S6Stage: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const c0 = cueFrame('stage', 0);
  const c1 = cueFrame('stage', 1);
  const endCardAt = cueFrame('stage', 2) + 30;
  const endCard = progress(frame, endCardAt, 16);

  const briefRows: Array<[string, string]> = [
    ['Baseline electricity', `${num(baselineEnergyKwh)} kWh/yr`],
    ['Estimated savings', `${num(savingsKwh)} kWh/yr (${powerReductionPct}%)`],
    ['Net annual savings', `${rp(netSavingsRp)}/yr`],
    ['Investment', rp(CASE.investmentRp)],
    ['Simple payback', `${(paybackYears ?? 0).toFixed(1)} years`],
    ['Assumption', `After-repair power ${CASE.afterRepairPowerKw} kW`],
    ['Missing evidence', 'Vendor quotation'],
  ];

  return (
    <SceneFrame index={6} label="Next step" durationInFrames={durationInFrames} headline="EnergiAction Bankable" chips={[]}>
      <div style={{ position: 'absolute', left: 110, top: 182, display: 'flex', alignItems: 'center', gap: 18, ...rise(frame, 10, 14, 14) }}>
        {FLOW.map((step, index) => (
          <span key={step} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {index > 0 && <ArrowRight width={46} color={COLOR.teal} />}
            <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 38, color: COLOR.teal }}>{step}</span>
          </span>
        ))}
      </div>

      {/* Investment decision brief */}
      <div style={{ position: 'absolute', left: 110, top: 270, width: 820, background: COLOR.white, border: `2px solid ${COLOR.ink}`, borderRadius: 6, padding: '22px 30px', ...rise(frame, 14, 30, 20) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: '0.08em', color: COLOR.muted }}>INVESTMENT DECISION BRIEF</span>
          <Chip kind="simulated" size={14} />
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 31, color: COLOR.ink, margin: '8px 0 12px' }}>Compressed air: leak repair and control tuning</div>
        {briefRows.map(([label, value], index) => (
          <div key={label} style={{ display: 'grid', gridTemplateColumns: '280px 1fr', padding: '8px 0', borderTop: `1px solid ${COLOR.line}`, ...rise(frame, 24 + index * 5, 8, 10) }}>
            <span style={{ fontFamily: FONT.body, fontSize: 23, color: COLOR.muted }}>{label}</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 24, fontWeight: 500, color: label === 'Missing evidence' ? COLOR.red : label === 'Assumption' ? COLOR.amber : COLOR.ink }}>{value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 26, alignItems: 'center', marginTop: 14, fontFamily: FONT.body, fontSize: 23, color: COLOR.ink }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 18, color: COLOR.muted, letterSpacing: '0.08em' }}>DECISION</span>
          {['Approve', 'Defer', 'Reject'].map((option) => (
            <span key={option} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Checkbox size={22} /> {option}</span>
          ))}
        </div>
      </div>

      {/* Stage and validation plan */}
      <div style={{ position: 'absolute', left: 990, top: 270, width: 820, ...slideIn(frame, c0, 50, 18) }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: '0.08em', color: COLOR.muted }}>CURRENT STAGE</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 92, color: COLOR.ink, lineHeight: 1.05 }}>Idea</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 10 }}>
          <Chip kind="future" size={16} />
          <span style={{ fontFamily: FONT.body, fontSize: 28, color: COLOR.inkSoft }}>Industrial validation planned</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 990, top: 490, width: 820, borderTop: `2px solid ${COLOR.ink}`, paddingTop: 18, ...rise(frame, c1, 16, 14) }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: '0.08em', color: COLOR.muted }}>NEXT, THROUGH MAJU</div>
        {['Test this workflow with industrial users', 'Measure whether it improves investment preparation'].map((goal, index) => (
          <div key={goal} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginTop: 14, fontFamily: FONT.body, fontSize: 30, color: COLOR.ink, ...rise(frame, c1 + 12 + index * 18, 10, 12) }}>
            <span style={{ width: 12, height: 12, background: COLOR.teal, flex: 'none', transform: 'translateY(-4px)' }} />
            {goal}
          </div>
        ))}
        <div style={{ fontFamily: FONT.body, fontSize: 21, color: COLOR.muted, marginTop: 20, ...rise(frame, c1 + 50, 8, 12) }}>
          No customer pilot or measured savings yet. All figures above are simulated.
        </div>
      </div>

      {/* End card */}
      {endCard > 0 && (
        <AbsoluteFill style={{ background: COLOR.paperDeep, opacity: endCard, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 112, color: COLOR.ink, letterSpacing: '-0.02em' }}>
            EnergiAction <span style={{ color: COLOR.teal }}>Bankable</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: COLOR.inkSoft, marginTop: 4 }}>From Energy Audit to Investment Decision</div>
          <div style={{ width: 160, height: 4, background: COLOR.teal, margin: '34px 0' }} />
          <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 40, color: COLOR.ink }}>Team ICs · Institut Teknologi Bandung</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 30, color: COLOR.teal, marginTop: 14, letterSpacing: '0.08em' }}>MAJU 2026</div>
          <div style={{ fontFamily: FONT.body, fontSize: 21, color: COLOR.muted, marginTop: 30 }}>Idea stage. Figures in this video are simulated.</div>
        </AbsoluteFill>
      )}
    </SceneFrame>
  );
};

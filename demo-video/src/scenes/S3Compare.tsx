import { useCurrentFrame } from 'remotion';
import { mix, progress, rise } from '../anim';
import { Chip } from '../components/Chip';
import { SceneFrame } from '../components/SceneFrame';
import { CASE, afterEnergyKwh, baselineEnergyKwh, num, rp, savingsKwh } from '../data/compressorCase';
import { COLOR, FONT } from '../theme';
import { cueFrame } from '../timing';

const INPUTS: Array<[string, string, string]> = [
  ['Baseline power', `${CASE.baselinePowerKw}`, 'kW'],
  ['After repair (estimated)', `${CASE.afterRepairPowerKw}`, 'kW'],
  ['Operating hours', num(CASE.operatingHoursPerYear), 'h/year'],
  ['Electricity tariff', num(CASE.tariffRpPerKwh), 'Rp/kWh'],
];

const BAR_MAX_WIDTH = 600;
const LABEL_WIDTH = 172;
const BARS_LEFT = 640;
const BAR_START = BARS_LEFT + LABEL_WIDTH;

export const S3Compare: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const c1 = cueFrame('compare', 1);
  const c2 = cueFrame('compare', 2);
  const c3 = cueFrame('compare', 3);
  const toolAt = c1 + 70;
  const introOut = progress(frame, toolAt - 12, 14);
  const barsAt = c2 + 70;
  const formulaAt = c3 - 6;

  const baselineWidth = BAR_MAX_WIDTH * progress(frame, barsAt, 26);
  const afterWidth = (BAR_MAX_WIDTH * afterEnergyKwh / baselineEnergyKwh) * progress(frame, barsAt + 14, 26);
  const gapStart = BAR_START + (BAR_MAX_WIDTH * afterEnergyKwh) / baselineEnergyKwh;
  const gapWidth = (BAR_MAX_WIDTH * savingsKwh) / baselineEnergyKwh;
  const bracket = progress(frame, barsAt + 44, 14);

  return (
    <SceneFrame
      index={3}
      label="Proposed tool"
      durationInFrames={durationInFrames}
      headline="Compare outcomes, not just recommendations"
      headlineStart={toolAt}
      chips={['proposed', 'concept', 'simulated']}
      chipsStart={toolAt}
    >
      {/* Product introduction */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', opacity: 1 - introOut, transform: `translateY(${-40 * introOut}px)` }}>
        <div style={{ ...rise(frame, cueFrame('compare', 0), 30, 20) }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 128, color: COLOR.ink, letterSpacing: '-0.02em' }}>
            EnergiAction <span style={{ color: COLOR.teal }}>Bankable</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 40, color: COLOR.inkSoft, marginTop: 6 }}>From Energy Audit to Investment Decision</div>
        </div>
        <div style={{ marginTop: 44, display: 'flex', justifyContent: 'center', gap: 18, alignItems: 'center', ...rise(frame, c1, 16, 16) }}>
          <Chip kind="proposed" size={20} />
          <span style={{ fontFamily: FONT.body, fontSize: 32, color: COLOR.ink }}>A proposed tool for industrial energy investment decisions</span>
        </div>
      </div>

      {/* Concept interface */}
      <div style={{ position: 'absolute', left: 110, top: 270, width: 1700, height: 600, background: COLOR.white, border: `2px solid ${COLOR.ink}`, borderRadius: 6, overflow: 'hidden', ...rise(frame, toolAt, 30, 18) }}>
        <div style={{ height: 60, background: COLOR.ink, color: COLOR.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px' }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 28 }}>EnergiAction Bankable · Scenario comparison</span>
          <span style={{ display: 'flex', gap: 10 }}><Chip kind="concept" size={14} /><Chip kind="simulated" size={14} /></span>
        </div>

        {/* Inputs */}
        <div style={{ position: 'absolute', left: 28, top: 84, width: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 18, color: COLOR.muted, letterSpacing: '0.08em' }}>OPERATING DATA</span>
          {INPUTS.map(([label, value, unit], index) => {
            const p = progress(frame, c2 + 6 + index * 16, 12);
            return (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: progress(frame, toolAt + 10, 12) }}>
                <span style={{ fontFamily: FONT.body, fontSize: 23, color: COLOR.inkSoft }}>{label}</span>
                <div style={{ display: 'flex', border: `2px solid ${p > 0.5 ? COLOR.teal : COLOR.line}`, borderRadius: 4, height: 58, alignItems: 'center' }}>
                  <span style={{ flex: 1, fontFamily: FONT.mono, fontSize: 30, fontWeight: 500, color: COLOR.ink, padding: '0 16px', opacity: p }}>{value}</span>
                  <span style={{ alignSelf: 'stretch', display: 'grid', placeItems: 'center', minWidth: 120, background: COLOR.paper, borderLeft: `2px solid ${COLOR.line}`, fontFamily: FONT.mono, fontSize: 20, color: COLOR.muted }}>{unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Before / after bars */}
        <div style={{ position: 'absolute', left: 640, top: 84, right: 28 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 18, color: COLOR.muted, letterSpacing: '0.08em' }}>ANNUAL ELECTRICITY USE</span>
        </div>
        {[
          ['Baseline', baselineWidth, baselineEnergyKwh, COLOR.inkSoft, 150],
          ['After repair', afterWidth, afterEnergyKwh, COLOR.teal, 236],
        ].map(([label, width, value, color, top]) => (
          <div key={label as string} style={{ position: 'absolute', left: BARS_LEFT, top: top as number, height: 56, display: 'flex', alignItems: 'center' }}>
            <span style={{ width: LABEL_WIDTH, fontFamily: FONT.body, fontSize: 24, color: COLOR.ink }}>{label}</span>
            <div style={{ width: width as number, height: 52, background: color as string, borderRadius: 3 }} />
            <span style={{ marginLeft: 14, fontFamily: FONT.mono, fontSize: 26, fontWeight: 500, color: COLOR.ink, opacity: progress(frame, barsAt + 24, 10), whiteSpace: 'nowrap' }}>
              {num(value as number)} kWh/yr
            </span>
          </div>
        ))}
        {/* Savings bracket on the gap */}
        <div style={{ position: 'absolute', left: gapStart, top: 296, width: gapWidth, opacity: bracket }}>
          <div style={{ height: 14, borderLeft: `3px solid ${COLOR.teal}`, borderRight: `3px solid ${COLOR.teal}`, borderBottom: `3px solid ${COLOR.teal}` }} />
          <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontFamily: FONT.mono, fontSize: 24, fontWeight: 500, color: COLOR.teal }}>
            savings {num(savingsKwh)} kWh/yr
          </div>
        </div>

        {/* Formula */}
        <div style={{ position: 'absolute', left: 640, top: 370, right: 28, borderTop: `1px solid ${COLOR.line}`, paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['Annual energy = Power × Operating hours', false],
            [`Baseline:      ${CASE.baselinePowerKw} kW × ${num(CASE.operatingHoursPerYear)} h = ${num(baselineEnergyKwh)} kWh/yr`, false],
            [`After repair:   ${CASE.afterRepairPowerKw} kW × ${num(CASE.operatingHoursPerYear)} h = ${num(afterEnergyKwh)} kWh/yr`, false],
            [`Savings: ${num(baselineEnergyKwh)} − ${num(afterEnergyKwh)} = ${num(savingsKwh)} kWh/yr`, true],
          ].map(([text, strong], index) => (
            <div key={index} style={{ fontFamily: FONT.mono, fontSize: 27, whiteSpace: 'pre', color: strong ? COLOR.teal : COLOR.ink, fontWeight: strong ? 500 : 400, ...rise(frame, formulaAt + index * 14, 10, 12) }}>
              {text as string}
            </div>
          ))}
        </div>
      </div>
    </SceneFrame>
  );
};

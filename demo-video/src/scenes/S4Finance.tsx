import { useCurrentFrame } from 'remotion';
import { progress, rise } from '../anim';
import { Chip } from '../components/Chip';
import { SceneFrame } from '../components/SceneFrame';
import { CASE, costSavingsRp, netSavingsRp, num, paybackYears, rp, savingsKwh } from '../data/compressorCase';
import { COLOR, FONT } from '../theme';
import { cueFrame } from '../timing';

const STEPS = [
  { title: 'Electricity cost savings', formula: `${num(savingsKwh)} kWh/yr × ${rp(CASE.tariffRpPerKwh)}/kWh`, result: `${rp(costSavingsRp)}/yr` },
  { title: 'Additional operating cost', formula: 'assumed for this case', result: `${rp(CASE.additionalOpexRpPerYear)}/yr` },
  { title: 'Net annual savings', formula: `${rp(costSavingsRp)} − ${rp(CASE.additionalOpexRpPerYear)}`, result: `${rp(netSavingsRp)}/yr` },
  { title: 'Simple payback', formula: `${rp(CASE.investmentRp)} ÷ ${rp(netSavingsRp)}/yr`, result: `${(paybackYears ?? 0).toFixed(1)} years` },
];

// Chart geometry: cumulative net savings against the investment, drawn to scale.
const CHART = { width: 600, height: 320, left: 90, top: 30, years: 4, maxMillion: 360 };
const xAt = (year: number) => CHART.left + (year / CHART.years) * CHART.width;
const yAt = (million: number) => CHART.top + CHART.height - (million / CHART.maxMillion) * CHART.height;

export const S4Finance: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const c1 = cueFrame('finance', 1);
  const c2 = cueFrame('finance', 2);
  const stepStarts = [c1 + 40, c1 + 70, c1 + 100, c2 + 6];
  const chartAt = c2 + 20;
  const line = progress(frame, chartAt, 40);
  const netMillion = netSavingsRp / 1_000_000;
  const investmentMillion = CASE.investmentRp / 1_000_000;
  const lineEndYear = CHART.years * line;
  const marker = progress(frame, chartAt + 40, 12);

  return (
    <SceneFrame index={4} label="Investment" durationInFrames={durationInFrames} headline="Do the savings justify the investment?" chips={['simulated']}>
      {/* Case summary */}
      <div style={{ position: 'absolute', left: 110, top: 262, width: 1700, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', ...rise(frame, cueFrame('finance', 0), 12, 14) }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 18, color: COLOR.amber, letterSpacing: '0.08em' }}>SIMULATED COMPRESSOR CASE</span>
        {[
          `${CASE.baselinePowerKw} kW to ${CASE.afterRepairPowerKw} kW (est.)`,
          `${num(CASE.operatingHoursPerYear)} h/yr`,
          `${rp(CASE.tariffRpPerKwh)}/kWh`,
          `Investment ${rp(CASE.investmentRp)}`,
          `Added cost ${rp(CASE.additionalOpexRpPerYear)}/yr`,
        ].map((text) => (
          <span key={text} style={{ fontFamily: FONT.mono, fontSize: 19, color: COLOR.ink, background: COLOR.white, border: `1px solid ${COLOR.line}`, padding: '6px 12px', borderRadius: 4 }}>{text}</span>
        ))}
      </div>

      {/* Savings figure */}
      <div style={{ position: 'absolute', left: 110, top: 338, ...rise(frame, c1 + 10, 20, 16) }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 88, color: COLOR.teal, lineHeight: 1 }}>{num(savingsKwh)} kWh/yr</div>
        <div style={{ fontFamily: FONT.body, fontSize: 26, color: COLOR.inkSoft, marginTop: 6 }}>Estimated electricity savings (simulated)</div>
      </div>

      {/* Calculation steps */}
      <div style={{ position: 'absolute', left: 110, top: 488, width: 900, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEPS.map((step, index) => {
          const isResult = index === STEPS.length - 1;
          return (
            <div key={step.title} style={{ display: 'grid', gridTemplateColumns: '46px 1fr', gap: 16, alignItems: 'center', padding: '8px 14px', background: isResult ? COLOR.tealSoft : COLOR.white, border: `1px solid ${isResult ? COLOR.teal : COLOR.line}`, borderRadius: 4, ...rise(frame, stepStarts[index], 14, 14) }}>
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: isResult ? COLOR.teal : COLOR.ink, color: COLOR.white, display: 'grid', placeItems: 'center', fontFamily: FONT.mono, fontSize: 20, fontWeight: 500 }}>{index + 1}</span>
              <div>
                <div style={{ fontFamily: FONT.body, fontSize: 20, lineHeight: 1.3, color: COLOR.muted }}>{step.title}</div>
                <div style={{ fontFamily: FONT.mono, fontSize: 25, lineHeight: 1.3, color: COLOR.ink, whiteSpace: 'nowrap' }}>
                  {step.formula} = <span style={{ fontWeight: 500, color: isResult ? COLOR.teal : COLOR.ink }}>{step.result}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payback chart */}
      <div style={{ position: 'absolute', left: 1060, top: 338, width: 750, height: 532, background: COLOR.white, border: `2px solid ${COLOR.ink}`, borderRadius: 6, padding: '18px 10px 0', ...rise(frame, c2, 20, 16) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 14px' }}>
          <span style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, color: COLOR.ink }}>Cumulative net savings vs investment</span>
          <Chip kind="simulated" size={13} />
        </div>
        <svg width={730} height={430} viewBox="0 0 730 430" style={{ marginTop: 8 }}>
          {[0, 90, 180, 270, 360].map((million) => (
            <g key={million}>
              <line x1={CHART.left} x2={CHART.left + CHART.width} y1={yAt(million)} y2={yAt(million)} stroke={COLOR.line} strokeWidth="1.5" />
              <text x={CHART.left - 12} y={yAt(million) + 7} textAnchor="end" fontFamily={FONT.mono} fontSize="19" fill={COLOR.muted}>{million}</text>
            </g>
          ))}
          {[0, 1, 2, 3, 4].map((year) => (
            <text key={year} x={xAt(year)} y={CHART.top + CHART.height + 30} textAnchor="middle" fontFamily={FONT.mono} fontSize="19" fill={COLOR.muted}>{year}</text>
          ))}
          <text x={CHART.left + CHART.width} y={CHART.top + CHART.height + 56} textAnchor="end" fontFamily={FONT.mono} fontSize="17" fill={COLOR.muted}>years</text>
          <text x={8} y={CHART.top - 10} fontFamily={FONT.mono} fontSize="17" fill={COLOR.muted}>Rp million</text>
          {/* Investment level */}
          <line x1={CHART.left} x2={CHART.left + CHART.width} y1={yAt(investmentMillion)} y2={yAt(investmentMillion)} stroke={COLOR.amber} strokeWidth="3" strokeDasharray="10 8" />
          <text x={CHART.left + CHART.width - 6} y={yAt(investmentMillion) - 12} textAnchor="end" fontFamily={FONT.mono} fontSize="19" fill={COLOR.amber}>investment {investmentMillion}</text>
          {/* Cumulative net savings: net x years */}
          <line x1={xAt(0)} y1={yAt(0)} x2={xAt(lineEndYear)} y2={yAt(netMillion * lineEndYear)} stroke={COLOR.teal} strokeWidth="5" strokeLinecap="round" />
          <text x={xAt(3)} y={yAt(netMillion * 3) + 34} fontFamily={FONT.mono} fontSize="19" fill={COLOR.teal} opacity={progress(frame, chartAt + 30, 10)}>+{netMillion} per year</text>
          {/* Break-even marker */}
          <g opacity={marker}>
            <line x1={xAt(paybackYears ?? 0)} x2={xAt(paybackYears ?? 0)} y1={yAt(investmentMillion)} y2={yAt(0)} stroke={COLOR.ink} strokeWidth="2" strokeDasharray="4 6" />
            <circle cx={xAt(paybackYears ?? 0)} cy={yAt(investmentMillion)} r="10" fill={COLOR.ink} />
            <rect x={xAt(paybackYears ?? 0) - 118} y={yAt(investmentMillion) - 76} width="236" height="44" rx="4" fill={COLOR.ink} />
            <text x={xAt(paybackYears ?? 0)} y={yAt(investmentMillion) - 46} textAnchor="middle" fontFamily={FONT.mono} fontSize="21" fontWeight="500" fill={COLOR.white}>payback {(paybackYears ?? 0).toFixed(1)} years</text>
          </g>
        </svg>
        <div style={{ fontFamily: FONT.body, fontSize: 20, color: COLOR.muted, padding: '0 14px', opacity: marker }}>
          Payback is shown only when net annual savings are above zero.
        </div>
      </div>
    </SceneFrame>
  );
};

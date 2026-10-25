import { interpolate } from 'remotion';
import { COLOR, FONT } from '../theme';

type Props = {
  frame: number;
  width?: number;
  showLeaks?: boolean;
  meterLabel?: string | null;
  meterOpacity?: number;
};

const VIEW_W = 820;
const VIEW_H = 500;

/** Self-drawn rotary screw compressor, air receiver, and distribution header with leaks. */
export const Compressor: React.FC<Props> = ({ frame, width = VIEW_W, showLeaks = true, meterLabel = null, meterOpacity = 1 }) => {
  const fanAngle = (frame * 9) % 360;
  const needle = -35 + Math.sin(frame / 18) * 6;
  const stroke = COLOR.ink;
  return (
    <svg width={width} height={(width * VIEW_H) / VIEW_W} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Compressed air system illustration">
      {/* Floor */}
      <line x1="10" y1="452" x2="810" y2="452" stroke={COLOR.line} strokeWidth="3" />

      {/* Power cable and optional clamp meter */}
      <path d="M10 330H56" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
      {meterLabel && (
        <g opacity={meterOpacity}>
          <rect x="4" y="232" width="118" height="62" rx="6" fill={COLOR.ink} />
          <text x="63" y="261" textAnchor="middle" fontFamily={FONT.mono} fontSize="24" fill={COLOR.white}>{meterLabel}</text>
          <text x="63" y="284" textAnchor="middle" fontFamily={FONT.mono} fontSize="14" fill="#9FD3CB">POWER LOGGER</text>
          <path d="M40 294V318M40 318a10 10 0 0 0 20 0V306" stroke={COLOR.ink} strokeWidth="4" fill="none" />
        </g>
      )}

      {/* Compressor package */}
      <rect x="56" y="150" width="320" height="292" rx="10" fill={COLOR.white} stroke={stroke} strokeWidth="4" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1="84" x2="226" y1={186 + i * 17} y2={186 + i * 17} stroke={COLOR.line} strokeWidth="5" strokeLinecap="round" />
      ))}
      <rect x="254" y="176" width="104" height="62" rx="5" fill={COLOR.ink} />
      <text x="306" y="214" textAnchor="middle" fontFamily={FONT.mono} fontSize="19" fill="#9FD3CB">7.5 bar</text>
      <circle cx="160" cy="364" r="54" fill={COLOR.paper} stroke={stroke} strokeWidth="4" />
      <g transform={`rotate(${fanAngle} 160 364)`}>
        {[0, 90, 180, 270].map((angle) => (
          <path key={angle} d="M160 364 C 170 334, 196 330, 200 344 C 192 356, 176 362, 160 364Z" fill={COLOR.inkSoft} transform={`rotate(${angle} 160 364)`} />
        ))}
      </g>
      <circle cx="160" cy="364" r="8" fill={COLOR.ink} />
      <text x="300" y="300" textAnchor="middle" fontFamily={FONT.mono} fontSize="15" fill={COLOR.muted}>ROTARY</text>
      <text x="300" y="320" textAnchor="middle" fontFamily={FONT.mono} fontSize="15" fill={COLOR.muted}>SCREW</text>

      {/* Discharge pipe to receiver */}
      <path d="M376 196H448" stroke={stroke} strokeWidth="12" strokeLinecap="round" fill="none" />

      {/* Air receiver tank with gauge */}
      <rect x="448" y="150" width="96" height="292" rx="48" fill={COLOR.white} stroke={stroke} strokeWidth="4" />
      <circle cx="496" cy="240" r="24" fill={COLOR.white} stroke={stroke} strokeWidth="3" />
      <line x1="496" y1="240" x2="496" y2="222" stroke={COLOR.red} strokeWidth="3" strokeLinecap="round" transform={`rotate(${needle} 496 240)`} />
      <text x="496" y="330" textAnchor="middle" fontFamily={FONT.mono} fontSize="14" fill={COLOR.muted}>AIR</text>
      <text x="496" y="348" textAnchor="middle" fontFamily={FONT.mono} fontSize="14" fill={COLOR.muted}>RECEIVER</text>

      {/* Distribution header and drops */}
      <path d="M544 300H800" stroke={stroke} strokeWidth="12" strokeLinecap="round" />
      <path d="M660 300V392M776 300V392" stroke={stroke} strokeWidth="8" strokeLinecap="round" />
      <rect x="638" y="392" width="44" height="40" rx="5" fill={COLOR.white} stroke={stroke} strokeWidth="3" />
      <rect x="754" y="392" width="44" height="40" rx="5" fill={COLOR.white} stroke={stroke} strokeWidth="3" />
      <text x="718" y="476" textAnchor="middle" fontFamily={FONT.mono} fontSize="14" fill={COLOR.muted}>END USE</text>

      {showLeaks && [600, 722].map((x, index) => <Leak key={x} x={x} y={300} frame={frame + index * 13} />)}
    </svg>
  );
};

const Leak: React.FC<{ x: number; y: number; frame: number }> = ({ x, y, frame }) => {
  const cycle = 36;
  return (
    <g>
      {[0, 1, 2].map((ring) => {
        const t = ((frame + ring * (cycle / 3)) % cycle) / cycle;
        const radius = interpolate(t, [0, 1], [8, 34]);
        return <path key={ring} d={`M${x - radius} ${y - 6 - radius * 0.6} A ${radius} ${radius} 0 0 1 ${x + radius} ${y - 6 - radius * 0.6}`} stroke={COLOR.red} strokeWidth="3" fill="none" opacity={1 - t} />;
      })}
      <circle cx={x} cy={y - 6} r="6" fill={COLOR.red} />
      <line x1={x} y1={y - 60} x2={x} y2={y - 40} stroke={COLOR.red} strokeWidth="2" />
      <rect x={x - 32} y={y - 92} width="64" height="30" rx="4" fill={COLOR.redSoft} stroke={COLOR.red} strokeWidth="2" />
      <text x={x} y={y - 71} textAnchor="middle" fontFamily={FONT.mono} fontSize="16" fontWeight="500" fill={COLOR.red}>LEAK</text>
    </g>
  );
};

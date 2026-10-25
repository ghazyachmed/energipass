import { useCurrentFrame } from 'remotion';
import { CUES } from '../timing';
import { progress } from '../anim';
import { COLOR, FONT } from '../theme';

/** Burned-in English subtitles, timed from src/generated/timeline.json. */
export const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const active = CUES.filter((cue) => frame >= cue.startFrame && frame < cue.endFrame).pop();
  if (!active) return null;
  const opacity = progress(frame, active.startFrame, 4);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 36, display: 'flex', justifyContent: 'center', opacity }}>
      <div
        style={{
          maxWidth: 1500, padding: '14px 30px', background: COLOR.captionBg, color: COLOR.white, borderRadius: 6,
          fontFamily: FONT.body, fontWeight: 500, fontSize: 38, lineHeight: 1.3, textAlign: 'center',
        }}
      >
        {active.text}
      </div>
    </div>
  );
};

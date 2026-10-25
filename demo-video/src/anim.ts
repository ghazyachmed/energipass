import { Easing, interpolate } from 'remotion';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0 to 1 over `duration` frames starting at `start`, eased out. */
export function progress(frame: number, start: number, duration = 15): number {
  return interpolate(frame, [start, start + duration], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
}

/** Fade and slide up into place. */
export function rise(frame: number, start: number, distance = 22, duration = 16): React.CSSProperties {
  const p = progress(frame, start, duration);
  return { opacity: p, transform: `translateY(${(1 - p) * distance}px)` };
}

/** Fade and slide in from the right. */
export function slideIn(frame: number, start: number, distance = 60, duration = 20): React.CSSProperties {
  const p = progress(frame, start, duration);
  return { opacity: p, transform: `translateX(${(1 - p) * distance}px)` };
}

/** Opacity for a scene that fades in at its start and out at its end. */
export function sceneOpacity(frame: number, total: number, edge = 12): number {
  return Math.min(progress(frame, 0, edge), 1 - progress(frame, total - edge, edge));
}

/** Linear interpolation between two numbers by p in [0, 1]. */
export function mix(from: number, to: number, p: number): number {
  return from + (to - from) * p;
}

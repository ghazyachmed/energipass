import timeline from './generated/timeline.json';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = timeline.durationSeconds * FPS;

export type SceneId = 'problem' | 'review' | 'compare' | 'finance' | 'evidence' | 'stage';

export const SCENES = timeline.scenes.map((scene) => ({
  id: scene.id as SceneId,
  from: Math.round(scene.start * FPS),
  durationInFrames: Math.round((scene.end - scene.start) * FPS),
}));

/** Frame of a narration cue, relative to the start of its scene. */
export function cueFrame(sceneId: SceneId, cueIndex: number): number {
  const scene = timeline.scenes.find((item) => item.id === sceneId);
  const cue = timeline.cues.filter((item) => item.scene === sceneId)[cueIndex];
  if (!scene || !cue) throw new Error(`Unknown cue ${sceneId}#${cueIndex}`);
  return Math.round((cue.start - scene.start) * FPS);
}

export const CUES = timeline.cues;

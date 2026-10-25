import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Caption } from './components/Caption';
import { PaperGround } from './components/SceneFrame';
import { S1Problem } from './scenes/S1Problem';
import { S2Review } from './scenes/S2Review';
import { S3Compare } from './scenes/S3Compare';
import { S4Finance } from './scenes/S4Finance';
import { S5Evidence } from './scenes/S5Evidence';
import { S6Stage } from './scenes/S6Stage';
import { SCENES, SceneId } from './timing';

const SCENE_COMPONENTS: Record<SceneId, React.FC<{ durationInFrames: number }>> = {
  problem: S1Problem,
  review: S2Review,
  compare: S3Compare,
  finance: S4Finance,
  evidence: S5Evidence,
  stage: S6Stage,
};

export const DemoVideo: React.FC = () => (
  <AbsoluteFill>
    <PaperGround />
    {SCENES.map(({ id, from, durationInFrames }) => {
      const Scene = SCENE_COMPONENTS[id];
      return (
        <Sequence key={id} from={from} durationInFrames={durationInFrames} name={id}>
          <Scene durationInFrames={durationInFrames} />
        </Sequence>
      );
    })}
    <Caption />
    <Audio src={staticFile('narration.wav')} />
  </AbsoluteFill>
);

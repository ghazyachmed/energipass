import { Composition } from 'remotion';
import { DemoVideo } from './DemoVideo';
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './timing';
import './fonts';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="EnergiActionEN"
    component={DemoVideo}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);

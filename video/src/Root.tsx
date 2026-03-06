import {Composition} from 'remotion';
import {KronosChamberPromo} from './scenes/KronosChamberPromo';

export const RemotionRoot: React.FC = () => {
  // Scene durations: intro(120) + hook(180) + tui(360) + desktop(360) + features(240) + cli(240) + proof(180) + flow(180) + cta(180) = 1860
  // Transitions: 8 × 20 = 160 frames
  // Total: 2020 frames
  return (
    <>
      <Composition
        id="KronosChamberPromo"
        component={KronosChamberPromo}
        durationInFrames={2020}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

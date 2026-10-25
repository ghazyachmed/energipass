// Render the demo video or still frames with Remotion.
//   node scripts/render.mjs video                 -> EnergiAction_MAJUON_2026_EN.mp4
//   node scripts/render.mjs stills 300 660 ...    -> out/frame-<n>.png
// Set REMOTION_BROWSER to a Chrome Headless Shell binary to skip Remotion's browser download.
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const COMPOSITION = 'EnergiActionEN';
const OUTPUT = resolve(ROOT, 'EnergiAction_MAJUON_2026_EN.mp4');
const [mode = 'video', ...frames] = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER || null;

const serveUrl = await bundle({ entryPoint: resolve(ROOT, 'src/index.ts'), publicDir: resolve(ROOT, 'public') });
const composition = await selectComposition({ serveUrl, id: COMPOSITION, browserExecutable });

if (mode === 'stills') {
  mkdirSync(resolve(ROOT, 'out'), { recursive: true });
  for (const frame of frames.map(Number)) {
    const output = resolve(ROOT, `out/frame-${String(frame).padStart(4, '0')}.png`);
    await renderStill({ serveUrl, composition, frame, output, browserExecutable });
    console.log(`still ${frame} -> ${output}`);
  }
} else {
  let lastPercent = -1;
  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    crf: 18,
    pixelFormat: 'yuv420p',
    // BT.709 with limited (tv) range: the most compatible setting for players and upload sites.
    colorSpace: 'bt709',
    audioCodec: 'aac',
    audioBitrate: '192k',
    outputLocation: OUTPUT,
    browserExecutable,
    concurrency: Number(process.env.RENDER_CONCURRENCY || 4),
    onProgress: ({ progress }) => {
      const percent = Math.floor(progress * 100);
      if (percent % 10 === 0 && percent !== lastPercent) {
        lastPercent = percent;
        console.log(`render ${percent}%`);
      }
    },
  });
  console.log(`video -> ${OUTPUT}`);
}

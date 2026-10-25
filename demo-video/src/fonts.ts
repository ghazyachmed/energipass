// Self-hosted IBM Plex (SIL Open Font License 1.1) from @fontsource, copied to public/fonts.
// loadFont() blocks rendering until each face is ready.
import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

const FACES: Array<[family: string, file: string, weight: string]> = [
  ['IBM Plex Sans', 'ibm-plex-sans-latin-400-normal.woff2', '400'],
  ['IBM Plex Sans', 'ibm-plex-sans-latin-500-normal.woff2', '500'],
  ['IBM Plex Sans', 'ibm-plex-sans-latin-600-normal.woff2', '600'],
  ['IBM Plex Sans', 'ibm-plex-sans-latin-700-normal.woff2', '700'],
  ['IBM Plex Sans Condensed', 'ibm-plex-sans-condensed-latin-600-normal.woff2', '600'],
  ['IBM Plex Sans Condensed', 'ibm-plex-sans-condensed-latin-700-normal.woff2', '700'],
  ['IBM Plex Mono', 'ibm-plex-mono-latin-400-normal.woff2', '400'],
  ['IBM Plex Mono', 'ibm-plex-mono-latin-500-normal.woff2', '500'],
];

for (const [family, file, weight] of FACES) {
  loadFont({ family, url: staticFile(`fonts/${file}`), weight });
}

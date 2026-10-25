// Visual tokens. Engineering-paper ground, ink lines, one teal accent.
// Amber marks simulated figures. Red marks the problem (air leaks).
export const COLOR = {
  paper: '#F1F3EF',
  paperDeep: '#E6EAE4',
  grid: 'rgba(16, 33, 43, 0.055)',
  gridMajor: 'rgba(16, 33, 43, 0.09)',
  ink: '#10212B',
  inkSoft: '#2E4350',
  muted: '#5A6A72',
  line: '#C3CDCD',
  white: '#FFFFFF',
  teal: '#0E7468',
  tealSoft: '#D8ECE8',
  amber: '#9A600E',
  amberSoft: '#F8EBD3',
  red: '#B4473F',
  redSoft: '#F6DEDB',
  captionBg: 'rgba(16, 33, 43, 0.93)',
} as const;

export const FONT = {
  display: '"IBM Plex Sans Condensed", "IBM Plex Sans", sans-serif',
  body: '"IBM Plex Sans", sans-serif',
  mono: '"IBM Plex Mono", monospace',
} as const;

export const LAYOUT = {
  marginX: 110,
  contentTop: 270,
  contentBottom: 880,
} as const;

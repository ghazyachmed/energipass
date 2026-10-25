// Verify the rendered MP4 against the delivery requirements.
//   node scripts/verify.mjs [path/to/video.mp4]
// Checks: duration, resolution, frame rate, codecs, audio presence, subtitle file
// against the timeline, narration energy inside every subtitle cue, and the
// simulated figures quoted in the narration. Exits with code 1 on any failure.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const video = resolve(process.argv[2] ?? resolve(ROOT, 'EnergiAction_MAJUON_2026_EN.mp4'));
const timeline = JSON.parse(readFileSync(resolve(ROOT, 'src/generated/timeline.json'), 'utf8'));
const narration = JSON.parse(readFileSync(resolve(ROOT, 'tts/narration.json'), 'utf8'));
const results = [];
const check = (name, ok, detail) => results.push({ name, ok: Boolean(ok), detail });

// 1. Container and streams
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', video], { encoding: 'utf8' }));
const v = probe.streams.find((s) => s.codec_type === 'video');
const a = probe.streams.find((s) => s.codec_type === 'audio');
const duration = Number(probe.format.duration);
const [num, den] = v.r_frame_rate.split('/').map(Number);
check('duration 90 s (±0.1)', Math.abs(duration - 90) <= 0.1, `${duration.toFixed(3)} s`);
check('resolution 1920x1080', v.width === 1920 && v.height === 1080, `${v.width}x${v.height}`);
check('frame rate 30 fps', num / den === 30, `${v.r_frame_rate}`);
check('video codec H.264', v.codec_name === 'h264', `${v.codec_name} ${v.profile ?? ''} ${v.pix_fmt}`);
check('pixel format yuv420p (limited range)', v.pix_fmt === 'yuv420p', `${v.pix_fmt}, range ${v.color_range ?? 'unset'}, space ${v.color_space ?? 'unset'}`);
check('video frame count 2700', Number(v.nb_frames) === 2700, `${v.nb_frames} frames`);
check('audio track present', Boolean(a), a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch` : 'none');

// 2. Subtitle file matches the timeline
const srt = readFileSync(resolve(ROOT, 'subtitles.srt'), 'utf8').trim().split(/\n\n+/);
const toSeconds = (t) => { const [h, m, rest] = t.split(':'); const [s, ms] = rest.split(','); return +h * 3600 + +m * 60 + +s + +ms / 1000; };
const parsed = srt.map((block) => {
  const lines = block.split('\n');
  const [start, end] = lines[1].split(' --> ').map(toSeconds);
  return { start, end, text: lines.slice(2).join(' ') };
});
check('SRT cue count matches timeline', parsed.length === timeline.cues.length, `${parsed.length} cues`);
const ordered = parsed.every((cue, i) => cue.end > cue.start && (i === 0 || cue.start >= parsed[i - 1].end - 1e-3));
check('SRT cues ordered, no overlap', ordered, '');
const textMatches = parsed.every((cue, i) => cue.text === timeline.cues[i].text);
check('SRT text equals narration script', textMatches, '');
check('last cue ends before 90 s', parsed.at(-1).end <= 90, `${parsed.at(-1).end.toFixed(2)} s`);

// 3. Audio energy inside each cue (narration really plays when the subtitle shows)
const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', video, '-map', '0:a:0', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], { maxBuffer: 64 * 1024 * 1024 });
const samples = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
const rms = (from, to) => {
  const a0 = Math.max(0, Math.floor(from * 16000)); const a1 = Math.min(samples.length, Math.floor(to * 16000));
  let sum = 0; for (let i = a0; i < a1; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, a1 - a0));
};
const db = (x) => 20 * Math.log10(Math.max(x, 1e-9));
const cueLevels = timeline.cues.map((cue) => db(rms(cue.start, cue.end)));
check('speech level inside every cue > -35 dBFS', cueLevels.every((level) => level > -35), `min ${Math.min(...cueLevels).toFixed(1)} dBFS`);
const silentGaps = timeline.scenes.map((scene) => db(rms(scene.start + 0.05, scene.narrationStart - 0.1)));
check('silence before narration in each scene < -50 dBFS', silentGaps.every((level) => level < -50), `max ${Math.max(...silentGaps).toFixed(1)} dBFS`);
const endSilence = db(rms(timeline.scenes.at(-1).narrationEnd + 0.2, 89.9));
check('no audio after final narration', endSilence < -50, `${endSilence.toFixed(1)} dBFS`);

// 4. Narrated figures match the simulated case (100 kW to 85 kW, 4,000 h, Rp1,500/kWh, Rp180,000,000)
const baseline = 100 * 4000; const after = 85 * 4000; const savings = baseline - after; const payback = 180_000_000 / (savings * 1500 - 0);
const spoken = narration.scenes.flatMap((scene) => scene.sentences.flatMap((s) => s.cues)).join(' ');
check('narration figure: sixty thousand kWh', savings === 60_000 && spoken.includes('sixty thousand kilowatt-hours'), `${savings} kWh`);
check('narration figure: payback two years', payback === 2 && spoken.includes('simple payback is two years'), `${payback} years`);

let failed = 0;
for (const r of results) {
  if (!r.ok) failed += 1;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed for ${video}`);
process.exit(failed ? 1 : 0);

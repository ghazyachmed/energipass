# EnergiAction Bankable: MAJU 2026 demo video (English)

A 90-second product demonstration rendered with Remotion. The narration uses English text-to-speech, and the English subtitles are burned into the video.

This folder is a separate project. It does not change the web app in the repository root.

## Deliverables

| File | Content |
| --- | --- |
| `EnergiAction_MAJUON_2026_EN.mp4` | Rendered video: 1920×1080, 30 fps, H.264, AAC narration, 90 s. Not committed to Git (size). Rebuild with the steps below. |
| `subtitles.srt` | 19 English subtitle cues, timed from the generated audio |
| `narration.md` | Narration script, scene timing, cue table, and the meaning of each on-screen label |
| `previews/` | Two preview frames from the rendered MP4 |

## Content rules applied

| Category | How it appears |
| --- | --- |
| Observed industry evidence | One statement with a citation on screen: Anderson and Newell (2004), Resource and Energy Economics 26(1), 27-50. Label: Industry Evidence. |
| Simulation | One fictional compressor case. Every figure carries the Simulated Data label. |
| Proposed product functions | Concept screens carry the Concept Simulation or Proposed Product label. |
| Planned AI | Shown in a separate dashed box labelled Planned Feature, "Not active in the current demo". |
| Future validation | Current stage: Idea. Industrial validation planned. Label: Future Validation. |

The video has no customers, endorsements, interviews, pilots, or measured savings. It does not attribute the simulated figures to WRI, the program sponsor, or any company.

## Simulated compressor case

| Quantity | Formula | Value |
| --- | --- | --- |
| Baseline electricity | 100 kW × 4,000 h/yr | 400,000 kWh/yr |
| After repair (estimated) | 85 kW × 4,000 h/yr | 340,000 kWh/yr |
| Electricity savings | 400,000 − 340,000 | 60,000 kWh/yr (15%) |
| Cost savings | 60,000 kWh/yr × Rp1,500/kWh | Rp90,000,000/yr |
| Additional operating cost | assumption | Rp0/yr |
| Net annual savings | Rp90,000,000 − Rp0 | Rp90,000,000/yr |
| Simple payback | Rp180,000,000 ÷ Rp90,000,000/yr | 2.0 years |

`src/data/compressorCase.ts` computes these values from the inputs and stops the render if any result differs from the table.

## Rebuild

Requirements: Node.js 22, Python 3.11 or newer, ffmpeg, and a Chrome Headless Shell binary (Remotion downloads one if `REMOTION_BROWSER` is not set).

```bash
cd demo-video
npm ci

# 1. Text-to-speech assets (Kokoro-82M, Apache-2.0) from npm, checked by SHA-256
./tts/fetch-models.sh
python3 -m venv tts/.venv && tts/.venv/bin/pip install -r tts/requirements.txt

# 2. Narration audio, subtitle cues, and timeline
tts/.venv/bin/python tts/generate.py

# 3. Render and verify
REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render
npm run verify
```

`npm run studio` opens the Remotion preview for editing.

## How the timing works

1. `tts/narration.json` holds the script, split into subtitle cues, and the six scene windows.
2. `tts/generate.py` synthesises each sentence, places it inside its scene window, and splits two-cue sentences at the quietest point near the phoneme-count estimate. It writes `public/narration.wav`, `src/generated/timeline.json`, and `subtitles.srt`.
3. The scenes read cue start times from `timeline.json`, so each visual beat follows the spoken line.

## Structure

```text
demo-video/
├── src/
│   ├── DemoVideo.tsx          six scene sequences, captions, narration audio
│   ├── scenes/                S1Problem ... S6Stage
│   ├── components/            compressor illustration, chips, icons, captions, scene frame
│   ├── data/compressorCase.ts the simulated case with consistency checks
│   └── generated/timeline.json
├── tts/                       narration script, TTS generator, model fetch script
├── scripts/render.mjs         render the MP4 or still frames
├── scripts/verify.mjs         ffprobe and synchronisation checks
├── public/                    narration.wav, IBM Plex font files
├── narration.md
├── subtitles.srt
└── previews/
```

## Licences of third-party assets

| Asset | Licence |
| --- | --- |
| Kokoro-82M model and voice vectors (via npm `kokoro-q8-shards`, `kokoro-js`) | Apache-2.0 |
| IBM Plex Sans, Sans Condensed, Mono (via `@fontsource`) | SIL Open Font License 1.1 |
| Remotion | Remotion License. Free for individuals and companies with up to 3 employees. Larger organisations need a company licence. Check remotion.dev/license before commercial use. |
| Compressor illustration, diagrams, interface mock-ups | Drawn in code for this video |

## Verification of the delivered render (25 October 2026)

`npm run verify` result: 16 of 16 checks passed.

| Check | Result |
| --- | --- |
| Duration | 90.005 s |
| Video | H.264 High, 1920×1080, 30/1 fps, 2,700 frames, yuv420p, BT.709, limited (tv) range |
| Audio | AAC LC, 48 kHz, 2 channels, integrated loudness −16.4 LUFS, true peak −4.5 dBFS |
| Subtitles | 19 cues, ordered, no overlap, text equal to the script, last cue ends at 89.11 s |
| Sync | Speech level inside every cue ≥ −18.1 dBFS. Silence before narration in every scene and after the final line. |
| Figures | 60,000 kWh/yr and 2.0 years match the formulas and the narration |
| File | 10.2 MB, SHA-256 `187a9d395b15835f620dded060e2b33ab0640c52ea4b6973789bbb1391d9941b` |

Additional checks:

- Frames at 18 time points were taken from the MP4 and inspected for cropped text, overlap, wrong numbers, and missing animation steps. Three layout problems found in earlier test renders were fixed: report and decision box overlap in scene 1, "7.5 bar" text outside its display, and a duplicated label in scene 6.
- An offline speech-recognition pass (Whisper-tiny, q8) transcribed the final audio with 7.0% word error rate across 143 words. Most differences are formatting ("60,000" for "sixty thousand") or names (see below).

## Known limits

- The narration voice is synthetic.
- The speech engine says "Energy Action" for "EnergiAction". Subtitles keep the product spelling.
- An automatic transcription check with Whisper-tiny heard "improvement scenarios" as "improvements in areas" and "MAJU" as "module". The phonemes sent to the speech model are correct. Listen to the final audio before submission.

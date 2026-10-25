"""Generate the English narration track and timed subtitle cues.

Text-to-speech: Kokoro-82M (Apache-2.0), ONNX q8 weights, voice from tts/narration.json.
Run tts/fetch-models.sh first.

Outputs
  public/narration.wav          mono, loudness-normalised, exactly durationSeconds long
  src/generated/timeline.json   cue and scene timing in seconds and frames (read by Remotion)
  subtitles.srt                 the same cues in SubRip format

Each sentence is synthesised on its own and placed inside its scene window.
A sentence that spans two subtitle cues is split at the quietest point near the
position predicted by phoneme count, so the cue boundary falls on a pause.
"""
import glob
import json
import math
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "tts" / ".models"
SAMPLE_RATE = 24000
SPLIT_SEARCH_SECONDS = 0.35
TAIL_MARGIN_SECONDS = 0.4
# Spoken form of words that the phonemiser reads differently from the caption.
PRONUNCIATION = {"EnergiAction": "Energy Action"}


def spoken(text: str) -> str:
    for written, said in PRONUNCIATION.items():
        text = text.replace(written, said)
    return text


def load_engine() -> Kokoro:
    voices_path = MODELS / "voices.npz"
    if not voices_path.exists():
        voices = {
            Path(path).stem: np.fromfile(path, dtype=np.float32).reshape(510, 1, 256)
            for path in glob.glob(str(MODELS / "kokoro-js" / "package" / "voices" / "*.bin"))
        }
        if not voices:
            sys.exit("Voices not found. Run tts/fetch-models.sh first.")
        np.savez(voices_path, **voices)
    return Kokoro(str(MODELS / "model_quantized.onnx"), str(voices_path))


def quietest_point(audio: np.ndarray, estimate_s: float) -> float:
    """Centre of the lowest-energy 20 ms window within the search range."""
    window = int(0.02 * SAMPLE_RATE)
    low = max(0, int((estimate_s - SPLIT_SEARCH_SECONDS) * SAMPLE_RATE))
    high = min(len(audio) - window, int((estimate_s + SPLIT_SEARCH_SECONDS) * SAMPLE_RATE))
    best_start, best_energy = int(estimate_s * SAMPLE_RATE), math.inf
    for start in range(low, max(low + 1, high), window // 2):
        energy = float(np.sqrt(np.mean(audio[start:start + window] ** 2)))
        if energy < best_energy:
            best_start, best_energy = start, energy
    return (best_start + window / 2) / SAMPLE_RATE


def srt_time(seconds: float) -> str:
    milliseconds = int(round(seconds * 1000))
    hours, rest = divmod(milliseconds, 3_600_000)
    minutes, rest = divmod(rest, 60_000)
    secs, millis = divmod(rest, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def main() -> None:
    config = json.loads((ROOT / "tts" / "narration.json").read_text())
    fps = config["fps"]
    engine = load_engine()
    track = np.zeros(int(config["durationSeconds"] * SAMPLE_RATE), dtype=np.float32)
    cues, scenes, problems = [], [], []

    for scene in config["scenes"]:
        cursor = scene["start"] + config["leadInSeconds"]
        narration_start = cursor
        for sentence in scene["sentences"]:
            text = sentence.get("tts") or " ".join(sentence["cues"])
            audio, rate = engine.create(spoken(text), voice=config["voice"], speed=config["speed"], lang="en-us")
            assert rate == SAMPLE_RATE
            duration = len(audio) / SAMPLE_RATE
            offset = int(round(cursor * SAMPLE_RATE))
            track[offset:offset + len(audio)] += audio

            # Split the sentence into cues at pauses near the phoneme-count estimate.
            weights = [len(engine.tokenizer.phonemize(spoken(cue), "en-us")) for cue in sentence["cues"]]
            boundaries, running = [0.0], 0
            for weight in weights[:-1]:
                running += weight
                boundaries.append(quietest_point(audio, duration * running / sum(weights)))
            boundaries.append(duration)
            for index, cue_text in enumerate(sentence["cues"]):
                start, end = cursor + boundaries[index], cursor + boundaries[index + 1]
                cues.append({"scene": scene["id"], "text": cue_text, "start": round(start, 3), "end": round(end, 3)})
            cursor += duration + config["sentenceGapSeconds"]

        narration_end = cursor - config["sentenceGapSeconds"]
        if narration_end > scene["end"] - TAIL_MARGIN_SECONDS:
            problems.append(f"{scene['id']}: narration ends at {narration_end:.2f}s, scene ends at {scene['end']}s")
        scenes.append({
            "id": scene["id"], "start": scene["start"], "end": scene["end"],
            "narrationStart": round(narration_start, 3), "narrationEnd": round(narration_end, 3),
        })

    if problems:
        sys.exit("Narration does not fit:\n" + "\n".join(problems))

    # Hold each caption up to 0.6 s after speech so it stays readable, but never
    # past the next cue. Keep a one-frame gap when there is room for it.
    one_frame = 1 / fps
    for current, following in zip(cues, cues[1:] + [None]):
        if following is None:
            limit = config["durationSeconds"]
        elif following["start"] - one_frame >= current["end"]:
            limit = following["start"] - one_frame
        else:
            limit = following["start"]
        scene_end = next(s["end"] for s in scenes if s["id"] == current["scene"])
        current["displayEnd"] = round(min(current["end"] + 0.6, limit, scene_end - 0.1), 3)
        current["startFrame"] = int(math.floor(current["start"] * fps))
        current["endFrame"] = int(math.ceil(current["displayEnd"] * fps))

    raw_path = ROOT / "tts" / ".models" / "narration_raw.wav"
    sf.write(raw_path, np.clip(track, -1, 1), SAMPLE_RATE, subtype="PCM_16")
    out_wav = ROOT / "public" / "narration.wav"
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(raw_path),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1",
        "-t", str(config["durationSeconds"]), str(out_wav),
    ], check=True)

    timeline = {"fps": fps, "durationSeconds": config["durationSeconds"], "voice": config["voice"],
                "speed": config["speed"], "scenes": scenes, "cues": cues}
    (ROOT / "src" / "generated" / "timeline.json").write_text(json.dumps(timeline, indent=2) + "\n")

    srt = []
    for number, cue in enumerate(cues, start=1):
        srt.append(f"{number}\n{srt_time(cue['start'])} --> {srt_time(cue['displayEnd'])}\n{cue['text']}\n")
    (ROOT / "subtitles.srt").write_text("\n".join(srt))

    for scene in scenes:
        print(f"{scene['id']:9} window {scene['start']:>2}-{scene['end']:>2}s  narration {scene['narrationStart']:6.2f}-{scene['narrationEnd']:6.2f}s")
    print(f"{len(cues)} cues written")


if __name__ == "__main__":
    os.chdir(ROOT)
    main()

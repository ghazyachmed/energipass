#!/usr/bin/env bash
# Download the Kokoro-82M TTS assets from npm (Apache-2.0) into tts/.models.
# - kokoro-q8-shards@1.0.0: model_quantized.onnx from onnx-community/Kokoro-82M-v1.0-ONNX, split in 6 parts
# - kokoro-js@1.2.1: voice style vectors (voices/*.bin)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p .models && cd .models
npm pack kokoro-q8-shards@1.0.0 kokoro-js@1.2.1 --silent >/dev/null
mkdir -p shards kokoro-js
tar xzf kokoro-q8-shards-1.0.0.tgz -C shards
tar xzf kokoro-js-1.2.1.tgz -C kokoro-js
cat shards/package/kokoro-q8.part{0,1,2,3,4,5}.bin > model_quantized.onnx
echo "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478  model_quantized.onnx" | sha256sum -c -
echo "Models ready in $(pwd)"

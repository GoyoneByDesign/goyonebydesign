# MAX-G original singing samples

`male-syllables-v1.json` contains 48 English monosyllables synthesized locally
for MAX-G on 2026-09-11. The words are general vocabulary, not an excerpt from
any song. No user's recording, cloned voice, artist performance, or paid/cloud
inference service was used.

The source was the already installed Kokoro v1.0 model with the `am_fenrir`
synthetic male preset, using the isolated `kokoro-onnx` 0.4.9 CPU runtime.
The installed model and voice bank were SHA-256 verified before generation:

- `kokoro-v1.0.int8.onnx`: `6e742170d309016e5891a994e1ce1559c702a2ccd0075e67ef7157974f6406cb`
- `voices-v1.0.bin`: `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`

Model: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M),
Apache License 2.0. CPU implementation:
[kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx), MIT license.
The generated output does not contain a model or a reusable voice embedding.

The bank is 16 kHz mono signed PCM16 encoded as base64, with integer pitch
marks and a voiced interval per word. `song-vocals.js` retains consonant
boundaries while stretching the voiced centre and placing pitch-synchronous
grains at each newly composed note. This is stylized synthetic singing, not a
claim of human performance or professional voice cloning. The browser does
not need to load Kokoro to sing these words.

The composer uses the bank's finite vocabulary to write new short combinations
of original lyrics and melodies. This bank does not support arbitrary lyrics,
other languages, or imitation of a requested singer. The singing preset is
separate from the voice selected for normal conversation.

# Usage: pocket-tts generate \[OPTIONS]

Generate speech using Kyutai Pocket TTS.

| Option                     | Description                                      | Default                                                                                             |
| -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| --text TEXT                | Text to generate                                 | Hello world. I am Kyutai's Pocket TTS. I'm fast enough to run on small CPUs. I hope you'll like me. |
| --voice TEXT               | Path to audio conditioning file (voice to clone) | alba                                                                                                |
| --quiet, -q                | Disable logging output                           | -                                                                                                   |
| --variant TEXT             | Model signature                                  | b6369a24                                                                                            |
| --lsd-decode-steps INTEGER | Number of generation steps                       | 1                                                                                                   |
| --temperature FLOAT        | Temperature for generation                       | 0.7                                                                                                 |
| --noise-clamp FLOAT        | Noise clamp value                                | -                                                                                                   |
| --eos-threshold FLOAT      | EOS threshold                                    | -4.0                                                                                                |
| --frames-after-eos INTEGER | Number of frames to generate after EOS           | -                                                                                                   |
| --output-path TEXT         | Output path for generated audio                  | ./tts\_output.wav                                                                                   |
| --device TEXT              | Device to use                                    | cpu                                                                                                 |
| --help                     | Show this message and exit                       | -                                                                                                   |

# Startup benchmark — baseline-source

- Binary: `node bin/clever.js`
- Warmups: 5 · Runs: 30
- Node: v22.17.0 · Platform: linux/x64
- Date: 2026-04-27T14:32:30.846Z

| Command | min (ms) | median (ms) | p95 (ms) | mean (ms) | stdev (ms) |
|---|---:|---:|---:|---:|---:|
| `--version` | 327.9 | 377.7 | 431.2 | 377.2 | 29.9 |
| `--help` | 334.9 | 400.4 | 500.6 | 402.8 | 43.0 |
| `accesslogs --help` | 339.8 | 429.2 | 495.6 | 424.5 | 59.0 |
| `addon list --help` | 309.2 | 369.4 | 495.5 | 382.2 | 49.1 |
| `help addon` | 348.7 | 384.5 | 491.1 | 398.8 | 45.0 |
| `bogus-cmd` | 323.6 | 378.6 | 465.6 | 385.5 | 38.3 |

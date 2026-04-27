# Startup benchmark — lazy-bundled

- Binary: `node bench-build/clever.cjs`
- Warmups: 5 · Runs: 30
- Node: v22.17.0 · Platform: linux/x64
- Date: 2026-04-27T15:04:28.303Z

| Command | min (ms) | median (ms) | p95 (ms) | mean (ms) | stdev (ms) |
|---|---:|---:|---:|---:|---:|
| `--version` | 118.4 | 136.5 | 164.5 | 138.9 | 13.6 |
| `--help` | 123.2 | 147.5 | 196.3 | 148.9 | 18.7 |
| `accesslogs --help` | 121.5 | 142.7 | 164.6 | 143.7 | 13.8 |
| `addon list --help` | 124.3 | 144.9 | 177.9 | 145.8 | 16.5 |
| `help addon` | 118.9 | 148.4 | 187.8 | 150.0 | 19.2 |
| `bogus-cmd` | 123.2 | 144.8 | 178.2 | 146.1 | 18.0 |

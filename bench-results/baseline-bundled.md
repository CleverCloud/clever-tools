# Startup benchmark — baseline-bundled

- Binary: `node bench-build/clever.cjs`
- Warmups: 5 · Runs: 30
- Node: v22.17.0 · Platform: linux/x64
- Date: 2026-04-27T14:34:17.178Z

| Command | min (ms) | median (ms) | p95 (ms) | mean (ms) | stdev (ms) |
|---|---:|---:|---:|---:|---:|
| `--version` | 126.5 | 135.9 | 182.1 | 140.4 | 15.4 |
| `--help` | 127.9 | 146.7 | 173.5 | 147.5 | 14.3 |
| `accesslogs --help` | 137.0 | 150.3 | 189.8 | 154.8 | 15.5 |
| `addon list --help` | 123.9 | 157.6 | 205.5 | 159.3 | 23.6 |
| `help addon` | 127.3 | 161.0 | 203.2 | 162.5 | 22.4 |
| `bogus-cmd` | 127.9 | 157.9 | 220.6 | 163.7 | 26.5 |

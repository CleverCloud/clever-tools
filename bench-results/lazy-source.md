# Startup benchmark — lazy-source

- Binary: `node bin/clever.js`
- Warmups: 5 · Runs: 30
- Node: v22.17.0 · Platform: linux/x64
- Date: 2026-04-27T15:03:57.501Z

| Command | min (ms) | median (ms) | p95 (ms) | mean (ms) | stdev (ms) |
|---|---:|---:|---:|---:|---:|
| `--version` | 192.3 | 209.8 | 253.8 | 215.0 | 21.8 |
| `--help` | 199.0 | 233.7 | 281.5 | 233.7 | 21.4 |
| `accesslogs --help` | 198.6 | 226.5 | 265.7 | 231.3 | 23.7 |
| `addon list --help` | 190.5 | 209.0 | 288.2 | 220.0 | 28.9 |
| `help addon` | 195.8 | 229.8 | 257.3 | 229.5 | 15.6 |
| `bogus-cmd` | 194.4 | 213.2 | 281.7 | 220.9 | 23.8 |

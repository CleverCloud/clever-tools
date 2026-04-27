# Startup comparison — baseline-bundled → lazy-bundled

| Command | baseline-bundled median (ms) | lazy-bundled median (ms) | Δ median | baseline-bundled p95 | lazy-bundled p95 | Δ p95 |
|---|---:|---:|---:|---:|---:|---:|
| `--version` | 135.9 | 136.5 | +0.6 (+0.4%) | 182.1 | 164.5 | -17.6 (-9.7%) |
| `--help` | 146.7 | 147.5 | +0.8 (+0.5%) | 173.5 | 196.3 | +22.8 (+13.1%) |
| `accesslogs --help` | 150.3 | 142.7 | -7.6 (-5.1%) | 189.8 | 164.6 | -25.2 (-13.3%) |
| `addon list --help` | 157.6 | 144.9 | -12.7 (-8.1%) | 205.5 | 177.9 | -27.6 (-13.4%) |
| `help addon` | 161.0 | 148.4 | -12.6 (-7.8%) | 203.2 | 187.8 | -15.4 (-7.6%) |
| `bogus-cmd` | 157.9 | 144.8 | -13.1 (-8.3%) | 220.6 | 178.2 | -42.4 (-19.2%) |

| round | change (one line) | test | train | test (non-control) | controls | $/run | docs read/run | spend |
|-------|-------------------|------|-------|--------------------|----------|-------|---------------|-------|
| 0 | baseline | 0.50 | 0.50 | 0.36 | 1.00 | $0.149 | 0.44 | 7.45 |
| 1 | read commands.md before the first command edit | 1.00 | 1.00 | 1.00 | 1.00 | $0.170 (1.1×) | 1.34 (3.0×) | 15.93 |

Best so far: round 1 (test 1.00, paired delta vs baseline +0.50, 95% CI [0.25, 0.75] over 14 test cases).

Sonnet 5.5 skipped `docs/contributing/commands.md` in half of its runs because two sentences of `AGENTS.md` told it the neighbouring code was enough for a small change ("Copy the closest neighbour", "For a small change to an existing command, the neighbouring code is usually enough"). Round 1 replaced them with an explicit rule: read `commands.md` before the first edit of any task that adds or changes a command, option, argument, accepted value or command behaviour, however small, and `api-client.md` too when an endpoint is called; read-only questions are exempt. Every one of the 44 non-control runs then opened `commands.md` before editing (a `Read` as the first or second call in the traces checked), the three controls still read no doc, latency is flat, and cost per run rises by 14% (one extra cached read, about 0.9 more docs per run). The eval is now saturated at 1.00 on every split: no headroom is left on `required_ok`, so the loop stops after one round.

Open: second-model check on Opus 5.5 (variant `v1` staged in `.claude/hillclimb/agents-docs/`, not run yet).

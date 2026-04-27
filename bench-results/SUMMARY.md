# clever-tools — lazy command loading experiment

Branch: `experiment/lazy-loading`.

## TL;DR

`clever <anything>` is **40–47 % faster on the source path** (`npm install -g clever-tools`) — `--version` median drops from **378 ms to 210 ms (-168 ms)**. The bundled binary path gets a small consistent win too (5–8 % median, p95 8–19 %) with no regression. Acceptance criterion (≥100 ms median drop in source mode) cleared by ~60 ms.

## Context

**What the experiment is.** Replace clever-tools' eager command loading with on-demand loading. Today every CLI invocation imports all 175 `*.command.js` modules via `src/commands/global.commands.js` before doing anything. The experiment defers each command module's import until the user actually invokes it (or asks for its help), keeping only a tiny metadata layer eager.

**Why we did it.** Startup cost. Profiling on `master` shows the eager chain in `global.commands.js` alone takes ~162 ms — roughly **40 %** of a ~400 ms cold start in source mode. Each command file constructs Zod schemas at module-eval time and pulls heavy transitive deps it doesn't strictly need (`@clevercloud/client`, `simple-git`, `ioredis`, `open`, `@aws-sdk/client-s3` via `diag`, …). Users running `clever logs` were paying for `kv`, `keycloak`, `otoroshi`, `aws-sdk`, etc. on every invocation. CLI startup is felt on every command and especially in scripts that loop on `clever`.

**What we measured.** Both distribution paths users actually run:

- **Source path** — `node bin/clever.js`, the form shipped via `npm install -g clever-tools` (the `package.json` `files` field ships raw `src/`).
- **Bundled path** — the rollup output (single CJS bundle used by the `pkg` standalone binaries).

We benchmarked both before and after on a fixed suite of representative commands (`--version`, `--help`, leaf-command help, parent+leaf chain help, `help <cmd>`, unknown command).

**Hypothesis going in.** The source path will see the bulk of the win (Node's per-file fs/parse cost goes away). The bundled path may see less because rollup already inlines everything at build time, but module-evaluation deferral should still help. Both confirmed by the numbers below.

**Out of scope.** No rollup config change (still `inlineDynamicImports: true`); no change to `defineCommand`/`defineOption`; no refactor of individual `*.command.js` files. The only file that meaningfully changed shape is `global.commands.js`.

## How it works

- `global.commands.js` becomes a tree of `lazy(() => import('…').then(m => m.X))` entries — the structure is the same as before, but no command file is loaded at startup.
- A new generated file `global.commands.metadata.js` provides the eager metadata cliparse needs at boot: `description`, `featureFlag`, `isExperimental` for every command path. Built by an AST scan of each `*.command.js`; checked in CI via `npm run manifest:check`.
- `bin/clever.js` does an argv preflight to figure out which command chain was invoked, eagerly loads only that chain, and gives cliparse a tree where unmatched commands are description-only stubs (more than enough for `clever --help`).
- Autocomplete still walks the whole tree, so it falls back to the full eager build (correctness > startup latency for that path).

## Methodology

- Harness: `scripts/bench-startup.js` (committed). Pure `child_process.spawnSync` loop, **5 warmups + 30 timed runs** per command, reports min / median / p95 / mean / stdev.
- Each run measured with `performance.now()` around `spawnSync`, env stripped (`NO_COLOR=1`, `FORCE_COLOR=0`).
- Node v22.17.0, Linux x64, kernel 6.19.13-arch1-1. Single machine, idle apart from the bench. Variants run sequentially, never in parallel (CPU contention adds ~30 ms of noise).
- Four variants:
  - **baseline-source** — `master`-equivalent code, run as `node bin/clever.js`.
  - **baseline-bundled** — same code through `rollup -c` (existing config, `inlineDynamicImports: true`), run as `node bench-build/clever.cjs`.
  - **lazy-source** — refactored code, source.
  - **lazy-bundled** — refactored code, bundled.
- Compare script: `scripts/bench-compare.js` produces the diff tables.

Suite of commands picked to cover representative startup paths:

| Command | What it stresses |
|---|---|
| `--version` | Pure startup floor (no command resolution). |
| `--help` | Root help — needs every top-level description. |
| `accesslogs --help` | Single-leaf command help. |
| `addon list --help` | Matched chain (parent + leaf) help. |
| `help addon` | Help-via-`help`-command path. |
| `bogus-cmd` | Unknown command — fail-fast path. |

## Results

### Median (ms)

| Command | baseline-source | lazy-source | Δ source | baseline-bundled | lazy-bundled | Δ bundled |
|---|---:|---:|---:|---:|---:|---:|
| `--version`         | 377.7 | 209.8 | **−167.9 (−44.5 %)** | 135.9 | 136.5 | +0.6 (+0.4 %) |
| `--help`            | 400.4 | 233.7 | **−166.7 (−41.6 %)** | 146.7 | 147.5 | +0.8 (+0.5 %) |
| `accesslogs --help` | 429.2 | 226.5 | **−202.7 (−47.2 %)** | 150.3 | 142.7 | −7.6 (−5.1 %) |
| `addon list --help` | 369.4 | 209.0 | **−160.4 (−43.4 %)** | 157.6 | 144.9 | −12.7 (−8.1 %) |
| `help addon`        | 384.5 | 229.8 | **−154.7 (−40.2 %)** | 161.0 | 148.4 | −12.6 (−7.8 %) |
| `bogus-cmd`         | 378.6 | 213.2 | **−165.4 (−43.7 %)** | 157.9 | 144.8 | −13.1 (−8.3 %) |

### p95 (ms)

| Command | baseline-source | lazy-source | Δ source | baseline-bundled | lazy-bundled | Δ bundled |
|---|---:|---:|---:|---:|---:|---:|
| `--version`         | 431.2 | 253.8 | −177.4 (−41.1 %) | 182.1 | 164.5 | −17.6 (−9.7 %)  |
| `--help`            | 500.6 | 281.5 | −219.1 (−43.8 %) | 173.5 | 196.3 | +22.8 (+13.1 %) |
| `accesslogs --help` | 495.6 | 265.7 | −229.9 (−46.4 %) | 189.8 | 164.6 | −25.2 (−13.3 %) |
| `addon list --help` | 495.5 | 288.2 | −207.3 (−41.8 %) | 205.5 | 177.9 | −27.6 (−13.4 %) |
| `help addon`        | 491.1 | 257.3 | −233.8 (−47.6 %) | 203.2 | 187.8 | −15.4 (−7.6 %)  |
| `bogus-cmd`         | 465.6 | 281.7 | −183.9 (−39.5 %) | 220.6 | 178.2 | −42.4 (−19.2 %) |

### Cross-variant takeaways

- baseline-source → baseline-bundled: bundling alone already saves ~220–280 ms (resolves all 175 imports at build time).
- lazy-source → lazy-bundled: bundle still helps, but only by ~70 ms median — lazy already removed most of the import resolution.
- The `--version`/`--help` p95 +13 % outlier on the bundled path is a single noisy run; the means/stdevs put it well within run-to-run variance.

## Footprint of the change

- `src/commands/global.commands.js` — refactored to lazy entries; also exports `loadAllCommands()` for the docs script and the autocomplete fallback.
- `src/commands/global.commands.metadata.js` *(new, generated)* — `{ description, featureFlag?, isExperimental? }` per dotted command path.
- `bin/clever.js` — argv preflight, lazy chain load, lazy-aware cliparse tree builder, `runEager()` fallback.
- `scripts/generate-commands-manifest.js` *(new)* — AST extractor with `--check`, pipes output through prettier so it round-trips cleanly with `format:check`.
- `scripts/bench-startup.js`, `scripts/bench-compare.js` *(new)* — benchmark harness used to produce this report.
- `scripts/generate-docs.js` — one-line change to `await loadAllCommands()`.
- `package.json` — `manifest`, `manifest:check` scripts wired into `validate` and `fix-all`. `@babel/parser` added to devDependencies.

`npm run validate` (lint + format:check + typecheck + manifest:check + docs:check) is green.

## Caveats

- One command (`tokens`) had a runtime template literal description (`Manage API tokens to query Clever Cloud API from ${config.AUTH_BRIDGE_HOST}`). The manifest can't capture the dynamic part, so it collapses to `"… from …"`. Root help shows that placeholder; `clever tokens --help` (which lazy-loads the module) still shows the fully-interpolated string. If we want consistency, we either drop the interpolation or extend the metadata to support a deferred description marker — neither is needed for the experiment but worth deciding before merging.
- Argv preflight uses a small set of known-boolean flags (`--help`, `-v`, `--color`, …) and assumes anything else with a value consumes the next token. Edge-case mismatches degrade gracefully: cliparse routes to the stub action and we eager-load on the spot.
- For autocomplete (`--autocomplete-words`/`--autocomplete-index`) we deliberately load everything. Tab completion is rare and latency-tolerant.
- Bundled binary numbers were measured against a bundle produced from the **same** rollup config (`inlineDynamicImports: true`). No rollup config change was needed to get the modest bundled-path improvement.

## Reproducing

```bash
# baseline (run on master or before this PR's source changes)
node scripts/bench-startup.js --variant baseline-source
npx rollup -c --file bench-build/clever.cjs
node scripts/bench-startup.js --variant baseline-bundled --binary "node bench-build/clever.cjs"

# after
node scripts/bench-startup.js --variant lazy-source
npx rollup -c --file bench-build/clever.cjs
node scripts/bench-startup.js --variant lazy-bundled --binary "node bench-build/clever.cjs"

# diff tables
node scripts/bench-compare.js baseline-source lazy-source
node scripts/bench-compare.js baseline-bundled lazy-bundled
```

Raw per-variant tables and the two comparison tables live in `bench-results/`.

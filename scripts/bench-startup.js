#!/usr/bin/env node
//
// Benchmark startup time for a chosen `clever` binary across a fixed set of
// commands. Writes a markdown table to bench-results/<variant>.md and stdout.
//
// USAGE:
//   bench-startup.js --variant <label> [--binary "<cmd>"] [--warmups N] [--runs N]
//
// EXAMPLES:
//   bench-startup.js --variant baseline-source
//   bench-startup.js --variant lazy-binary --binary ./dist/clever
//   bench-startup.js --variant baseline-source --binary "node bin/clever.js" --runs 30

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const COMMANDS = [
  { id: 'version', argv: ['--version'] },
  { id: 'help-root', argv: ['--help'] },
  { id: 'help-leaf', argv: ['accesslogs', '--help'] },
  { id: 'help-chain', argv: ['addon', 'list', '--help'] },
  { id: 'help-via-help', argv: ['help', 'addon'] },
  { id: 'unknown', argv: ['bogus-cmd'] },
];

function parseArgs(argv) {
  const args = { variant: null, binary: 'node bin/clever.js', warmups: 5, runs: 30 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--variant') args.variant = argv[++i];
    else if (a === '--binary') args.binary = argv[++i];
    else if (a === '--warmups') args.warmups = Number(argv[++i]);
    else if (a === '--runs') args.runs = Number(argv[++i]);
    else throw new Error(`Unknown arg: ${a}`);
  }
  if (!args.variant) throw new Error('--variant <label> is required');
  return args;
}

function splitBinary(binary) {
  const parts = binary.trim().split(/\s+/);
  return { cmd: parts[0], baseArgs: parts.slice(1) };
}

function runOnce(cmd, baseArgs, extraArgs) {
  const t0 = performance.now();
  const r = spawnSync(cmd, [...baseArgs, ...extraArgs], {
    stdio: ['ignore', 'ignore', 'ignore'],
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  const t1 = performance.now();
  if (r.error) throw r.error;
  return t1 - t0;
}

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0];
  const median = sorted[Math.floor(n / 2)];
  const p95 = sorted[Math.min(n - 1, Math.floor(n * 0.95))];
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const variance = sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const stdev = Math.sqrt(variance);
  return { min, median, p95, mean, stdev, n };
}

function fmt(ms) {
  return `${ms.toFixed(1)}`;
}

async function main() {
  const args = parseArgs(process.argv);
  const { cmd, baseArgs } = splitBinary(args.binary);

  // Sanity: ensure binary works at all.
  const sanity = spawnSync(cmd, [...baseArgs, '--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
  if (sanity.status !== 0) {
    console.error(`Binary '${args.binary}' failed --version sanity check (exit ${sanity.status}).`);
    console.error(sanity.stderr?.toString() ?? '');
    process.exit(1);
  }

  const rows = [];
  for (const c of COMMANDS) {
    process.stderr.write(`[${args.variant}] ${c.id} (${c.argv.join(' ')}) `);
    for (let i = 0; i < args.warmups; i++) {
      runOnce(cmd, baseArgs, c.argv);
      process.stderr.write('.');
    }
    const samples = [];
    for (let i = 0; i < args.runs; i++) {
      samples.push(runOnce(cmd, baseArgs, c.argv));
      process.stderr.write('+');
    }
    const s = stats(samples);
    process.stderr.write(` median=${fmt(s.median)}ms\n`);
    rows.push({ id: c.id, argv: c.argv.join(' '), ...s });
  }

  const header = [
    `# Startup benchmark — ${args.variant}`,
    '',
    `- Binary: \`${args.binary}\``,
    `- Warmups: ${args.warmups} · Runs: ${args.runs}`,
    `- Node: ${process.version} · Platform: ${process.platform}/${process.arch}`,
    `- Date: ${new Date().toISOString()}`,
    '',
    '| Command | min (ms) | median (ms) | p95 (ms) | mean (ms) | stdev (ms) |',
    '|---|---:|---:|---:|---:|---:|',
  ];
  const body = rows.map(
    (r) => `| \`${r.argv}\` | ${fmt(r.min)} | ${fmt(r.median)} | ${fmt(r.p95)} | ${fmt(r.mean)} | ${fmt(r.stdev)} |`,
  );
  const md = [...header, ...body, ''].join('\n');

  const outPath = path.resolve(import.meta.dirname, '..', 'bench-results', `${args.variant}.md`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, md, 'utf-8');

  process.stdout.write(md);
  process.stderr.write(`\nWrote ${outPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

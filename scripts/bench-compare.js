#!/usr/bin/env node
//
// Compare two startup-benchmark result files produced by bench-startup.js.
// Prints a side-by-side delta table to stdout.
//
// USAGE:
//   bench-compare.js <baseline-variant> <after-variant>
//
// EXAMPLES:
//   bench-compare.js baseline-source lazy-source
//   bench-compare.js baseline-binary lazy-binary

import fs from 'node:fs/promises';
import path from 'node:path';

function parseTable(md) {
  // Find the row of column headers, then read each subsequent table row.
  const lines = md.split('\n');
  const headerIdx = lines.findIndex((l) => /^\|\s*Command\s*\|/.test(l));
  if (headerIdx === -1) throw new Error('No table header found');
  const rows = [];
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|')) break;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 6) continue;
    rows.push({
      cmd: cells[0].replace(/^`|`$/g, ''),
      min: Number(cells[1]),
      median: Number(cells[2]),
      p95: Number(cells[3]),
      mean: Number(cells[4]),
      stdev: Number(cells[5]),
    });
  }
  return rows;
}

function delta(before, after) {
  const abs = after - before;
  const pct = before === 0 ? 0 : (abs / before) * 100;
  const sign = abs >= 0 ? '+' : '';
  return `${sign}${abs.toFixed(1)} (${sign}${pct.toFixed(1)}%)`;
}

async function main() {
  const [, , baselineLabel, afterLabel] = process.argv;
  if (!baselineLabel || !afterLabel) {
    console.error('Usage: bench-compare.js <baseline-variant> <after-variant>');
    process.exit(1);
  }

  const dir = path.resolve(import.meta.dirname, '..', 'bench-results');
  const beforeMd = await fs.readFile(path.join(dir, `${baselineLabel}.md`), 'utf-8');
  const afterMd = await fs.readFile(path.join(dir, `${afterLabel}.md`), 'utf-8');

  const before = parseTable(beforeMd);
  const after = parseTable(afterMd);

  const out = [
    `# Startup comparison — ${baselineLabel} → ${afterLabel}`,
    '',
    `| Command | ${baselineLabel} median (ms) | ${afterLabel} median (ms) | Δ median | ${baselineLabel} p95 | ${afterLabel} p95 | Δ p95 |`,
    '|---|---:|---:|---:|---:|---:|---:|',
  ];

  for (const b of before) {
    const a = after.find((x) => x.cmd === b.cmd);
    if (!a) {
      out.push(`| \`${b.cmd}\` | ${b.median.toFixed(1)} | — | — | ${b.p95.toFixed(1)} | — | — |`);
      continue;
    }
    out.push(
      `| \`${b.cmd}\` | ${b.median.toFixed(1)} | ${a.median.toFixed(1)} | ${delta(b.median, a.median)} | ${b.p95.toFixed(1)} | ${a.p95.toFixed(1)} | ${delta(b.p95, a.p95)} |`,
    );
  }

  const md = out.join('\n') + '\n';
  process.stdout.write(md);

  const outPath = path.join(dir, `compare-${baselineLabel}--${afterLabel}.md`);
  await fs.writeFile(outPath, md, 'utf-8');
  process.stderr.write(`\nWrote ${outPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

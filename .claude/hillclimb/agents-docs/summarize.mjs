// Recompute the headline numbers from raw results.jsonl rows (no aggregate field is trusted).
//   node .claude/hillclimb/agents-docs/summarize.mjs <flow-dir> [<flow-dir> ...]
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : 'n/a');

for (const dir of process.argv.slice(2)) {
  const rows = read(join(dir, 'baseline', 'results.jsonl'));
  const errors = read(join(dir, 'baseline', 'errors.jsonl'));
  console.log(`\n## ${dir}  rows=${rows.length} errors=${errors.length} models=${[...new Set(rows.map((r) => r.model))].join(',')}`);
  const groups = new Map();
  for (const r of rows) {
    const g = r.tags[0];
    (groups.get(g) ?? groups.set(g, []).get(g)).push(r);
  }
  groups.set('ALL', rows);
  const noControl = rows.filter((r) => r.tags[0] !== 'control');
  groups.set('ALL non-control', noControl);
  for (const [g, rs] of groups) {
    // per case mean over reps, then over cases
    const byCase = new Map();
    for (const r of rs) (byCase.get(r.prompt_id) ?? byCase.set(r.prompt_id, []).get(r.prompt_id)).push(r);
    const caseMeans = [...byCase.values()].map((c) => mean(c.map((r) => r.grade.required_ok)));
    const rep = rs.map((r) => r.grade.required_ok);
    console.log(
      `${g.padEnd(16)} cases=${String(byCase.size).padStart(2)} reps=${String(rs.length).padStart(2)}  ` +
        `required_ok=${f(mean(rep))} (per-case mean ${f(mean(caseMeans))})  recall=${f(mean(rs.map((r) => r.grade.required_recall)))}  ` +
        `cost/run=$${f(mean(rs.map((r) => r.cost_usd)), 3)}  lat=${f(mean(rs.map((r) => r.latency_s)), 1)}s  docs_read=${f(mean(rs.map((r) => r.docs_read)), 1)}  ` +
        `edit=${f(mean(rs.map((r) => r.edit_attempted)))}  AGENTS_read=${f(mean(rs.map((r) => r.agents_md_read)))}`,
    );
  }
  console.log(`total cost $${f(rows.reduce((s, r) => s + (r.cost_usd ?? 0), 0))}`);
  console.log('per case (reps ok): ' + [...new Set(rows.map((r) => r.prompt_id))].sort().map((id) => `${id}:${rows.filter((r) => r.prompt_id === id).map((r) => r.grade.required_ok).join('')}`).join(' '));
  const missing = rows.filter((r) => !(r.cost_usd > 0) || !r.usage?.output_tokens || !(r.latency_s > 0));
  console.log(`rows with missing/zero cost, usage or latency: ${missing.length}`);
}

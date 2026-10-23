// Per-variant scores by split, recomputed from raw rows, with a paired delta against baseline on the test split.
//   node .claude/hillclimb/agents-docs/split-scores.mjs <flow-dir> <variant> [<variant> ...]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const [flow, ...variants] = process.argv.slice(2);
const st = JSON.parse(readFileSync(join(flow, '_state.json'), 'utf8'));
const load = (v) => readFileSync(join(flow, v, 'results.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const f = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : 'n/a');

// per case mean over reps, then over cases
const perCase = (rows, ids, key = (r) => r.grade.required_ok) => {
  const m = new Map();
  for (const r of rows) if (ids.includes(r.prompt_id)) (m.get(r.prompt_id) ?? m.set(r.prompt_id, []).get(r.prompt_id)).push(key(r));
  return new Map([...m].map(([id, xs]) => [id, mean(xs)]));
};
const avg = (m) => mean([...m.values()]);
const controls = st.test_ids.filter((id) => id.startsWith('c'));
const testNC = st.test_ids.filter((id) => !id.startsWith('c'));

const base = perCase(load('baseline'), st.test_ids);
for (const v of ['baseline', ...variants]) {
  const rows = load(v);
  const test = perCase(rows, st.test_ids);
  const diffs = [...test].map(([id, x]) => x - (base.get(id) ?? NaN));
  const dm = mean(diffs);
  const se = Math.sqrt(diffs.reduce((s, d) => s + (d - dm) ** 2, 0) / (diffs.length - 1) / diffs.length);
  const cost = rows.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
  console.log(
    `${v.padEnd(9)} rows=${rows.length}  train=${f(avg(perCase(rows, st.train_ids)))}  test=${f(avg(test))}  test(non-control)=${f(avg(perCase(rows, testNC)))}  controls=${f(avg(perCase(rows, controls)))}  ` +
      `Δtest vs baseline=${f(dm)} [${f(dm - 1.96 * se)}, ${f(dm + 1.96 * se)}]  cost/run=$${f(cost / rows.length, 3)}  lat=${f(mean(rows.map((r) => r.latency_s)), 1)}s  docs_read=${f(mean(rows.map((r) => r.docs_read)), 2)}  spend=$${f(cost)}`,
  );
}

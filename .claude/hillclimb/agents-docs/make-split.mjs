// Fixed random split, stratified by tags[0], never by baseline score. Controls always go to test (guardrail).
// Writes train_ids / test_ids and the hillclimb config into the _state.json of each flow given.
//   node .claude/hillclimb/agents-docs/make-split.mjs <flow-dir> [<flow-dir> ...]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SEED = 20261023;
const cases = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(SEED);
const shuffle = (xs) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const train = [];
const test = cases.filter((c) => c.control).map((c) => c.id);
for (const stratum of ['new-command', 'extend-command']) {
  const ids = shuffle(cases.filter((c) => c.tags[0] === stratum).map((c) => c.id));
  const nTrain = stratum === 'new-command' ? 4 : 7;
  train.push(...ids.slice(0, nTrain));
  test.push(...ids.slice(nTrain));
}
train.sort();
test.sort();

for (const flow of process.argv.slice(2)) {
  const p = join(flow, '_state.json');
  const st = JSON.parse(readFileSync(p, 'utf8'));
  st.train_ids = train;
  st.test_ids = test;
  st.reps = 2;
  st.current_round = 0;
  st.approve_each_round = false;
  st.goal = { target: 'required_ok', direction: 'higher', hold: ['cost_usd', 'latency_s'] };
  st.harness_paths = (st.harness_paths ?? []).filter((x) => x !== 'AGENTS.md');
  delete st.harness_sha;
  writeFileSync(p, JSON.stringify(st, null, 2) + '\n');
}
console.log(JSON.stringify({ train, test }));

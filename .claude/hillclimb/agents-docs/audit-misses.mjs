// For rows graded required_ok=0, list tool calls that mention docs/contributing yet were not counted as a read.
//   node .claude/hillclimb/agents-docs/audit-misses.mjs <flow-dir>
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const rows = readFileSync(join(dir, 'baseline', 'results.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
let failed = 0;
let withMention = 0;
for (const r of rows) {
  if (r.grade.required_ok === 1) continue;
  failed++;
  const t = JSON.parse(readFileSync(join(dir, 'baseline', 'traces', `${r.prompt_id}_rep${r.rep}.json`), 'utf8'));
  const hits = t.filter((x) => x.role === 'tool_call' && /contributing/.test(x.content));
  if (hits.length) {
    withMention++;
    console.log(`\n${r.prompt_id} rep${r.rep}: ${r.explanation.required_ok}`);
    for (const h of hits) console.log(`  ${h.name}: ${h.content.replace(/\s+/g, ' ').slice(0, 220)}`);
  }
}
console.log(`\nfailed rows: ${failed}, with a tool call mentioning docs/contributing: ${withMention}`);

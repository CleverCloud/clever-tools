// Offline check of the analyzer and the grader: oracle must pass, nulls must fail. No API call.
//   node .claude/hillclimb/agents-docs/selftest.mjs
import assert from 'node:assert/strict';
import { analyze, grade, toTranscript } from './agents-docs.lib.mjs';

let seq = 0;
const call = (name, input) => ({
  type: 'assistant',
  message: { id: `m${seq++}`, model: 'claude-opus-5-5', usage: { input_tokens: 1, output_tokens: 1 }, content: [{ type: 'tool_use', id: `t${seq}`, name, input }] },
});
const read = (doc) => call('Read', { file_path: `/work/repo/docs/contributing/${doc}.md` });
const edit = () => call('Edit', { file_path: '/work/repo/src/x.js', old_string: 'a', new_string: 'b' });
const bash = (command) => call('Bash', { command });

const newCommand = { id: 'n', required: ['commands', 'api-client'], soft: ['code-style', 'docs-generation'] };
const plainCommand = { id: 'e', required: ['commands'], soft: ['code-style'] };
const control = { id: 'c', control: true, tolerated: ['codebase-map'] };

const check = (label, input, events, want) => {
  const g = grade(input, analyze(events));
  assert.equal(g.grade.required_ok, want, `${label}: required_ok`);
  console.log(`ok  ${label}`);
  return g;
};

// oracle: reads everything required before editing
check('oracle', newCommand, [read('commands'), read('api-client'), edit()], 1);
check('oracle via cat', plainCommand, [bash('cat docs/contributing/commands.md'), edit()], 1);
check('oracle via glob', plainCommand, [bash('cat docs/contributing/*.md'), edit()], 1);
// null: nothing read
check('null: edit straight away', plainCommand, [edit()], 0);
check('null: empty run', plainCommand, [], 0);
// read after the edit does not count
check('late read', plainCommand, [edit(), read('commands')], 0);
// partial credit is visible but not a pass
const partial = check('partial', newCommand, [read('commands'), edit()], 0);
assert.equal(partial.grade.required_recall, 0.5);
// no edit attempted: whole run counts
check('no edit, docs read', plainCommand, [read('commands')], 1);
// a grep peek is not a read, even when another stage of the line uses sed (pilot n03 false positive)
check('grep peek + sed elsewhere', plainCommand, [bash('grep -n "since" docs/contributing/commands.md | head; sed -n 45,120p docs/kubernetes.md'), edit()], 0);
check('cd then cat', plainCommand, [bash('cd repo && cat docs/contributing/commands.md'), edit()], 1);
check('cat several files', plainCommand, [bash('cat src/a.js docs/contributing/commands.md'), edit()], 1);
// grep for a doc name is not a read; ls of the directory is not a read
check('ls is not a read', plainCommand, [bash('ls docs/contributing/'), edit()], 0);
// write detection: a redirect to /dev/null and quoted arrows do not end the window
check('benign bash before read', plainCommand, [bash('grep -rn "=>" src 2>/dev/null | head'), read('commands'), edit()], 1);
check('write bash ends the window', plainCommand, [bash('echo x > /tmp/y'), read('commands')], 0);
// controls
check('control: nothing read', control, [bash('grep -n node mise.toml')], 1);
check('control: forbidden read', control, [read('commands')], 0);
check('control: tolerated read', control, [read('codebase-map')], 1);
// served model
assert.deepEqual(analyze([read('commands')]).models, ['claude-opus-5-5']);
// transcript redacts tokens
const t = toTranscript('hi sk-ant-abcdefghijklmnop', []);
assert.ok(!t[0].content.includes('sk-ant-abcdefghijklmnop'));
console.log('selftest passed');

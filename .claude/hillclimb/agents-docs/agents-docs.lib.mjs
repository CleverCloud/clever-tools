// Library of the `agents-docs` eval: sandbox construction, trace analysis, grading.
// Kept apart from run-eval.mjs so selftest.mjs and sandbox-check.mjs can import it
// without starting a run. Run everything from the repository root.

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const ROOT = process.cwd();

export const ALL_DOCS = [
  'api-client',
  'build-ci-and-release',
  'code-quality',
  'code-style',
  'codebase-map',
  'commands',
  'docs-generation',
  'issues-commits-and-prs',
  'scripts',
  'testing',
];

const READ_VERB = /\b(cat|head|tail|sed|less|more|bat|nl|awk|view)\b/;
const DOC_FILE = /docs\/contributing\/([A-Za-z0-9._-]+?)\.md\b/g;
const DOC_GLOB = /docs\/contributing\/\*/;
const REDACT = /sk-ant-[A-Za-z0-9_-]{10,}/g;

function run(cmd, args, input) {
  return execFileSync(cmd, args, { input, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 1 << 29 });
}

// --- sandbox ----------------------------------------------------------------

/**
 * Fresh directory holding one case: the tree of the parent of the original commit
 * (HEAD for controls) with no git history, the AGENTS.md and docs/contributing and
 * docs/adr of HEAD laid over it, and a project hook that stops the run at the
 * first Edit/Write attempt.
 */
export function buildSandbox(input, opts = {}) {
  const base = mkdtempSync(join(tmpdir(), 'agents-docs-'));
  const repo = join(base, 'repo');
  const cfg = join(base, 'claude-config');
  mkdirSync(repo);
  mkdirSync(cfg);
  mkdirSync(join(base, 'home'));
  writeFileSync(join(cfg, '.credentials.json'), '');

  const rev = input.commit ? `${input.commit}^` : 'HEAD';
  run('tar', ['-x', '-C', repo], run('git', ['-C', ROOT, 'archive', '--format=tar', rev]));

  // Never let anything of the solution or of the eval itself through.
  rmSync(join(repo, '.claude'), { recursive: true, force: true });
  rmSync(join(repo, 'AGENTS.md'), { force: true });
  rmSync(join(repo, 'docs', 'contributing'), { recursive: true, force: true });
  rmSync(join(repo, 'docs', 'adr'), { recursive: true, force: true });
  run('tar', ['-x', '-C', repo], run('git', ['-C', ROOT, 'archive', '--format=tar', 'HEAD', 'AGENTS.md', 'docs/contributing', 'docs/adr']));

  // Hillclimb variants carry their own AGENTS.md snapshot: it replaces the one of HEAD.
  if (opts.agentsMd) copyFileSync(opts.agentsMd, join(repo, 'AGENTS.md'));

  const hook = join(base, 'stop-hook.js');
  writeFileSync(
    hook,
    "process.stdin.resume();process.stdin.on('data',()=>{});" +
      "process.stdin.on('end',()=>console.log(JSON.stringify({continue:false,stopReason:'eval: first edit attempted'})));\n",
  );
  mkdirSync(join(repo, '.claude'));
  writeFileSync(
    join(repo, '.claude', 'settings.json'),
    JSON.stringify({
      hooks: {
        PreToolUse: [
          { matcher: 'Edit|Write|MultiEdit|NotebookEdit', hooks: [{ type: 'command', command: `node ${hook}` }] },
        ],
      },
    }),
  );

  const git = (...a) => run('git', ['-C', repo, '-c', 'user.name=eval', '-c', 'user.email=eval@example.invalid', '-c', 'commit.gpgsign=false', ...a]);
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'snapshot');
  return { base, repo, cfg };
}

export function cleanup(sb) {
  rmSync(sb.base, { recursive: true, force: true });
}

export function claudeBin() {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  for (const dir of (process.env.PATH ?? '').split(':')) {
    const p = join(dir, 'claude');
    if (dir && existsSync(p)) return realpathSync(p);
  }
  throw new Error('claude not found in PATH (set CLAUDE_BIN)');
}

/** bwrap command line: read-only system, masked $HOME and /run/user, only the case dir writable. */
export function bwrapArgv(sb, cmd) {
  const home = homedir();
  // Only the two toolchains the run needs, never the whole mise tree: it also holds released
  // builds of the CLI under test, which would put the solution within reach.
  const nodeRoot = dirname(dirname(process.execPath));
  const claudeRoot = dirname(claudeBin());
  const args = [
    '--die-with-parent', '--unshare-pid', '--unshare-ipc', '--new-session',
    '--ro-bind', '/', '/', '--dev', '/dev', '--proc', '/proc',
    '--tmpfs', '/tmp', '--tmpfs', '/run/user', '--tmpfs', home,
    '--ro-bind', nodeRoot, nodeRoot,
    '--ro-bind', claudeRoot, claudeRoot,
    '--bind', sb.base, sb.base,
    '--bind', join(home, '.claude', '.credentials.json'), join(sb.cfg, '.credentials.json'),
  ];
  if (existsSync('/run/docker.sock')) args.push('--ro-bind', '/dev/null', '/run/docker.sock');
  args.push(
    '--chdir', sb.repo, '--clearenv',
    '--setenv', 'HOME', join(sb.base, 'home'),
    '--setenv', 'PATH', `${dirname(process.execPath)}:/usr/local/bin:/usr/bin:/bin`,
    '--setenv', 'CLAUDE_CONFIG_DIR', sb.cfg,
    '--setenv', 'TERM', 'dumb', '--setenv', 'LANG', 'C.UTF-8', '--setenv', 'NO_COLOR', '1',
    '--setenv', 'DISABLE_AUTOUPDATER', '1', '--setenv', 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', '1',
    '--', ...cmd,
  );
  return args;
}

// --- trace analysis -----------------------------------------------------------

function docsIn(text) {
  const found = [...text.matchAll(DOC_FILE)].map((m) => m[1]);
  if (DOC_GLOB.test(text)) found.push(...ALL_DOCS);
  return found;
}

function isWriteCmd(cmd) {
  const s = cmd
    .replace(/"[^"]*"|'[^']*'/g, '""')
    .replace(/&?\d*>\s*\/dev\/null/g, '')
    .replace(/\d*>&\d/g, '');
  return (
    /(^|[\s\d])>{1,2}\s*[^\s&|;>]/.test(s) ||
    /\bsed\s+(-[a-zA-Z]*i|--in-place)/.test(s) ||
    /\b(tee|mkdir|touch|rm|mv|cp|chmod|ln)\b/.test(s) ||
    /\bnpm\s+(run|install|ci|i|test)\b/.test(s) ||
    /\bgit\s+(commit|add|checkout|apply|stash|reset|clean)\b/.test(s)
  );
}

function classify(block, i, sub) {
  const input = block.input ?? {};
  const a = { i, name: block.name, sub, docs: [], agentsMd: false, mutation: false };
  if (block.name === 'Read') {
    const p = String(input.file_path ?? '');
    a.docs = docsIn(p);
    a.agentsMd = /(^|\/)AGENTS\.md$/.test(p);
  } else if (block.name === 'Bash') {
    const c = String(input.command ?? '');
    // A doc counts as read only when a viewing command is applied to it in the same
    // pipeline stage: `grep x docs/contributing/a.md | head` is a peek, not a read.
    for (const stage of c.split(/\|\||&&|;|\||\n/)) {
      if (!READ_VERB.test(stage.trim().split(/\s+/)[0] ?? '')) continue;
      a.docs.push(...docsIn(stage));
      if (/AGENTS\.md/.test(stage)) a.agentsMd = true;
    }
    a.mutation = isWriteCmd(c);
  } else if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(block.name)) {
    a.mutation = true;
  }
  return a;
}

/** Reduce the stream-json events of one run to what grading and reporting need. */
export function analyze(events) {
  const acts = [];
  const models = new Set();
  const usageById = new Map();
  let n = 0;
  for (const ev of events) {
    if (ev.type !== 'assistant' || !ev.message) continue;
    const m = ev.message;
    const sub = Boolean(ev.parent_tool_use_id);
    if (!sub && m.model && m.model !== '<synthetic>') models.add(m.model);
    if (m.id && m.usage) usageById.set(m.id, m.usage);
    for (const b of m.content ?? []) if (b.type === 'tool_use') acts.push(classify(b, n++, sub));
  }
  const firstMutation = acts.find((a) => a.mutation)?.i ?? Infinity;
  const readBefore = new Set();
  const readAll = new Set();
  for (const a of acts) {
    for (const d of a.docs) {
      readAll.add(d);
      if (a.i < firstMutation) readBefore.add(d);
    }
  }
  const usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  for (const u of usageById.values()) for (const k of Object.keys(usage)) usage[k] += u[k] ?? 0;
  return {
    models: [...models],
    usage,
    toolCalls: acts.length,
    editAttempted: firstMutation !== Infinity,
    readBefore: [...readBefore],
    readAll: [...readAll],
    agentsMdRead: acts.some((a) => a.agentsMd),
    subagent: acts.some((a) => a.sub),
  };
}

// --- grading -------------------------------------------------------------------

const norm = (d) => String(d).replace(/\.md$/, '');

/**
 * required_ok: every `required` doc was read before the first edit attempt (the whole run when
 * no edit was attempted). Controls pass when no doc outside `tolerated` was read at all.
 */
export function grade(input, an) {
  if (input.control) {
    const tolerated = new Set((input.tolerated ?? []).map(norm));
    const bad = an.readAll.filter((d) => !tolerated.has(d));
    const ok = bad.length === 0 ? 1 : 0;
    return {
      grade: { required_ok: ok, required_recall: ok },
      explanation: {
        required_ok: ok ? 'no forbidden doc read' : `forbidden docs read: ${bad.join(', ')}`,
        required_recall: 'same as required_ok for controls',
      },
      soft_recall: undefined,
    };
  }
  const required = (input.required ?? []).map(norm);
  const soft = (input.soft ?? []).map(norm);
  const read = new Set(an.readBefore);
  const hit = required.filter((d) => read.has(d));
  const missing = required.filter((d) => !read.has(d));
  return {
    grade: {
      required_ok: missing.length === 0 ? 1 : 0,
      required_recall: required.length ? hit.length / required.length : 1,
    },
    explanation: {
      required_ok: `read before ${an.editAttempted ? 'first edit' : 'end of run (no edit attempted)'}: ${[...read].join(', ') || 'none'}; missing: ${missing.join(', ') || 'none'}`,
      required_recall: `${hit.length}/${required.length} required docs`,
    },
    soft_recall: soft.length ? soft.filter((d) => read.has(d)).length / soft.length : undefined,
  };
}

// --- transcript ------------------------------------------------------------------

const clip = (s, n = 3000) => (s.length > n ? `${s.slice(0, n)}\n[truncated ${s.length - n} chars]` : s);
const redact = (s) => s.replace(REDACT, '[redacted]');

export function toTranscript(prompt, events) {
  const turns = [{ role: 'user', content: redact(prompt) }];
  let thinking;
  for (const ev of events) {
    const content = ev.message?.content;
    if (!Array.isArray(content)) continue;
    if (ev.type === 'assistant') {
      for (const b of content) {
        if (b.type === 'thinking' && b.thinking) thinking = redact(b.thinking);
        else if (b.type === 'text' && b.text) {
          turns.push({ role: 'assistant', content: redact(b.text), ...(thinking ? { thinking } : {}) });
          thinking = undefined;
        } else if (b.type === 'tool_use') {
          turns.push({ role: 'tool_call', name: b.name, content: redact(JSON.stringify(b.input ?? {}, null, 2)), ...(thinking ? { thinking } : {}) });
          thinking = undefined;
        }
      }
    } else if (ev.type === 'user') {
      for (const b of content) {
        if (b.type !== 'tool_result') continue;
        const text = typeof b.content === 'string' ? b.content : (b.content ?? []).map((c) => c.text ?? '').join('\n');
        turns.push({ role: 'tool_result', content: redact(clip(text)) });
      }
    }
  }
  return turns;
}

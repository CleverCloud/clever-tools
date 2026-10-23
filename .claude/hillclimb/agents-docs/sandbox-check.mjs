// Builds one sandbox and probes it from the inside. No API call, no credential content is read.
//   node .claude/hillclimb/agents-docs/sandbox-check.mjs
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { bwrapArgv, buildSandbox, cleanup } from './agents-docs.lib.mjs';

const HOME = homedir();
const sb = buildSandbox({ commit: '2ab3fede' });
const script = `
echo "== home content (expect empty)"; ls -A ${HOME}
echo "== host repo reachable? (expect no)"; test -e ${HOME}/dev && echo YES || echo no
echo "== gh / clever config reachable? (expect no, no)"; test -e ${HOME}/.config/gh && echo YES || echo no; test -e ${HOME}/.config/clever-cloud && echo YES || echo no
echo "== released clever-tools install reachable? (expect no)"; ls -d ${HOME}/.local/share/mise/installs/npm-clever-tools 2>/dev/null && echo YES || echo no
echo "== mise installs visible (expect node and claude only)"; ls ${HOME}/.local/share/mise/installs
echo "== claude creds mounted (expect yes)"; test -s "$CLAUDE_CONFIG_DIR/.credentials.json" && echo yes || echo no
echo "== /run/user (expect empty)"; ls -A /run/user
echo "== docker socket usable? (expect no)"; test -S /run/docker.sock && echo YES || echo no
echo "== env names"; env | cut -d= -f1 | sort | tr '\\n' ' '; echo
echo "== write outside case dir (expect fail)"; (touch /usr/x 2>&1 || true) | head -1
echo "== write inside case dir (expect ok)"; touch ./probe && echo ok && rm ./probe
echo "== git history (expect 1 commit)"; git log --all --oneline | wc -l
echo "== solution reachable? (expect 0)"; grep -rl "filterDrainsByType" src docs 2>/dev/null | wc -l
echo "== docs under test present (expect yes, yes)"; test -f AGENTS.md && echo yes; test -f docs/contributing/commands.md && echo yes
echo "== eval files reachable? (expect no)"; test -e .claude/hillclimb && echo YES || echo no
echo "== tools"; command -v node git rg claude
`;
try {
  const r = spawnSync('bwrap', bwrapArgv(sb, ['bash', '-c', script]), { encoding: 'utf8' });
  process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  console.log(`exit ${r.status}`);
} finally {
  cleanup(sb);
}

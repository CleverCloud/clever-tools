#!/usr/bin/env node
//
// Manage code coverage reports published to Cellar storage.
//
// This script handles the coverage report workflow for clever-tools PRs:
// - Publishing the local `coverage/` directory to Cellar under the per-preview prefix
// - Deleting a previously-published coverage report (e.g. when a PR is closed)
// - Generating a GitHub PR comment with a summary table and a link to the report
//
// USAGE:
//   coverage.js publish [branch-name]
//   coverage.js delete [branch-name]
//   coverage.js pr-comment [branch-name]
//
// ARGUMENTS:
//   command         Command to execute (publish|delete|pr-comment)
//   [branch-name]   Branch name (e.g., "my-feature"), defaults to current git branch
//
// ENVIRONMENT VARIABLES:
//   CC_CLEVER_TOOLS_PREVIEWS_CELLAR_BUCKET      Preview storage bucket (required for publish/delete/pr-comment)
//   CC_CLEVER_TOOLS_PREVIEWS_CELLAR_KEY_ID      Cellar access key (required for publish/delete)
//   CC_CLEVER_TOOLS_PREVIEWS_CELLAR_SECRET_KEY  Cellar secret key (required for publish/delete)
//
// EXAMPLES:
//   coverage.js publish
//   coverage.js publish feature-branch
//   coverage.js delete feature-branch
//   coverage.js pr-comment feature-branch

import dedent from 'dedent';
import fs from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { CellarClientPublic } from './lib/cellar-client-public.js';
import { CellarClient } from './lib/cellar-client.js';
import { ArgumentError, readEnvVars, runCommand, UnknownCommandError } from './lib/command.js';
import { readJson } from './lib/fs.js';
import { getCurrentBranch } from './lib/git.js';
import { CODE_COVERAGE_DIR } from './lib/paths.js';
import { highlight } from './lib/terminal.js';
import { getVersion } from './lib/utils.js';

/**
 * @typedef {{ pct: number, covered: number, total: number, skipped: number }} CoverageMetric
 * @typedef {{ statements: CoverageMetric, branches: CoverageMetric, functions: CoverageMetric, lines: CoverageMetric }} CoverageMetrics
 * @typedef {{ total: CoverageMetrics }} CoverageSummary
 */

const DEFAULT_PREVIEW_CELLAR_BUCKET = 'clever-tools-preview.clever-cloud.com';
const LOCAL_REPORT_DIR = 'coverage';
const LOCAL_SUMMARY_PATH = `${LOCAL_REPORT_DIR}/coverage-summary.json`;
const REMOTE_SUMMARY_FILE = 'coverage-summary.json';
const SKIP_DIRS = ['tmp', 'lcov-report'];
const MASTER_BRANCH_NAME = 'master';
/** @type {Array<keyof CoverageMetrics>} */
const METRIC_KEYS = ['statements', 'branches', 'functions', 'lines'];
/** @type {Record<keyof CoverageMetrics, string>} */
const METRIC_LABELS = {
  statements: 'Statements',
  branches: 'Branches',
  functions: 'Functions',
  lines: 'Lines',
};

/**
 * Remote path for the coverage report of a given preview, relative to the bucket root.
 * @param {string} previewName
 * @returns {string}
 */
function getRemoteReportDir(previewName) {
  return `${CODE_COVERAGE_DIR}/${previewName}`;
}

runCommand(async () => {
  const [command, rawPreviewName] = process.argv.slice(2);

  if (command == null || command.length === 0) {
    throw new ArgumentError('command');
  }

  const branchDirectory = getVersion(rawPreviewName ?? (await getCurrentBranch()));

  switch (command) {
    case 'publish':
      return publishCoverage(branchDirectory);
    case 'delete':
      return deleteCoverage(branchDirectory);
    case 'pr-comment':
      return printPrComment(branchDirectory);
  }

  throw new UnknownCommandError(command);
});

/**
 * Uploads every file in the local `coverage/` directory to Cellar under the per-preview prefix.
 * @param {string} branchDirectory
 * @returns {Promise<void>}
 */
async function publishCoverage(branchDirectory) {
  const cellarClient = createCellarClient();
  const remoteDir = getRemoteReportDir(branchDirectory);

  const files = await listFilesRecursive(LOCAL_REPORT_DIR);
  const items = files.map((file) => ({
    filepath: file,
    remoteFilepath: `${remoteDir}/${relative(LOCAL_REPORT_DIR, file).split(sep).join('/')}`,
  }));
  await cellarClient.uploadFiles(items, {
    onUpload: ({ filepath, remoteFilepath }) => {
      console.log(highlight`=> Upload ${filepath} to ${remoteFilepath}`);
    },
  });

  const reportUrl = cellarClient.getPublicUrl(`${remoteDir}/index.html`);
  console.log(highlight`=> Coverage report available at ${reportUrl}`);
}

/**
 * Deletes the published coverage report for a given preview.
 * @param {string} branchDirectory
 * @returns {Promise<void>}
 */
async function deleteCoverage(branchDirectory) {
  const cellarClient = createCellarClient();
  const remoteDir = getRemoteReportDir(branchDirectory);
  console.log(highlight`=> Delete ${remoteDir + '/**'}`);
  await cellarClient.delete(remoteDir);
}

/**
 * Emits a markdown comment with the coverage totals and a link to the report.
 * When a master coverage summary is available on Cellar, renders a Master / PR / Δ comparison
 * table; otherwise falls back to the PR-only table.
 * @param {string} branchDirectory
 * @returns {Promise<void>}
 */
async function printPrComment(branchDirectory) {
  const cellarClient = createCellarClientPublic();
  const reportUrl = cellarClient.getPublicUrl(`${getRemoteReportDir(branchDirectory)}/index.html`);
  const masterReportUrl = cellarClient.getPublicUrl(`${getRemoteReportDir(MASTER_BRANCH_NAME)}/index.html`);

  const prSummary = /** @type {CoverageSummary} */ (await readJson(LOCAL_SUMMARY_PATH));
  const masterSummary = await tryFetchMasterSummary(cellarClient);

  const table = masterSummary
    ? renderComparisonTable(masterSummary.total, prSummary.total)
    : renderSingleTable(prSummary.total);

  const reportLinks = masterSummary
    ? `[Browse the PR HTML report](${reportUrl}) · [Browse the master HTML report](${masterReportUrl})`
    : `[Browse the full HTML report](${reportUrl})`;

  console.log(dedent`
    📊 A code coverage report has been automatically published!

    ${table}

    ${reportLinks}

    _This report will be deleted once this PR is closed._
  `);
}

/**
 * Fetches the master coverage summary from Cellar. Returns null on any failure
 * (404, network error, malformed JSON, unexpected shape) so the caller can
 * fall back to the PR-only table.
 * @param {CellarClientPublic} cellarClient
 * @returns {Promise<CoverageSummary | null>}
 */
async function tryFetchMasterSummary(cellarClient) {
  try {
    const raw = await cellarClient.getObject(`${getRemoteReportDir(MASTER_BRANCH_NAME)}/${REMOTE_SUMMARY_FILE}`);
    const parsed = JSON.parse(raw);
    if (parsed?.total?.statements?.pct == null) {
      return null;
    }
    return /** @type {CoverageSummary} */ (parsed);
  } catch {
    return null;
  }
}

/**
 * @param {CoverageMetrics} pr
 * @returns {string}
 */
function renderSingleTable(pr) {
  const rows = METRIC_KEYS.map((key) => {
    const m = pr[key];
    return `| ${METRIC_LABELS[key]} | ${formatPct(m)} | ${formatCount(m)} |`;
  }).join('\n');
  return (
    dedent`
    | Metric | Coverage | Covered / Total |
    | --- | ---: | ---: |
  ` +
    '\n' +
    rows
  );
}

/**
 * @param {CoverageMetrics} master
 * @param {CoverageMetrics} pr
 * @returns {string}
 */
function renderComparisonTable(master, pr) {
  const rows = METRIC_KEYS.map((key) => {
    const masterMetric = master[key];
    const prMetric = pr[key];
    const masterCell = masterMetric != null ? formatPct(masterMetric) : 'n/a';
    const deltaCell = masterMetric != null ? formatDelta(masterMetric.pct, prMetric.pct) : '—';
    return `| ${METRIC_LABELS[key]} | ${masterCell} | ${formatPct(prMetric)} | ${deltaCell} | ${formatCount(prMetric)} |`;
  }).join('\n');
  return (
    dedent`
    | Metric | Master | PR | Δ | Covered / Total |
    | --- | ---: | ---: | ---: | ---: |
  ` +
    '\n' +
    rows
  );
}

/**
 * @param {CoverageMetric} m
 * @returns {string}
 */
function formatPct(m) {
  return `${m.pct.toFixed(2)}%`;
}

/**
 * @param {CoverageMetric} m
 * @returns {string}
 */
function formatCount(m) {
  return `${m.covered} / ${m.total}`;
}

/**
 * Formats the PR-vs-master coverage delta as a colored MathJax expression that GitHub
 * markdown renders inline. `%` is escaped because it's a comment marker in LaTeX math mode.
 * @param {number} masterPct
 * @param {number} prPct
 * @returns {string}
 */
function formatDelta(masterPct, prPct) {
  const delta = prPct - masterPct;
  const rounded = delta.toFixed(2);
  if (rounded === '0.00' || rounded === '-0.00') {
    return '—';
  }
  if (delta > 0) {
    return `$\\color{green}{\\uparrow +${rounded}\\%}$`;
  }
  return `$\\color{red}{\\downarrow ${rounded}\\%}$`;
}

/**
 * Recursively lists every regular file inside a directory, skipping `SKIP_DIRS` subdirectories.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function listFilesRecursive(dir) {
  const entries = await fs.readdir(dir, { recursive: true, withFileTypes: true });
  const skipPrefixes = SKIP_DIRS.map((sub) => join(dir, sub) + sep);
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((path) => !skipPrefixes.some((prefix) => path.startsWith(prefix)));
}

/**
 * @returns {CellarClient}
 */
function createCellarClient() {
  const bucket = process.env.CC_CLEVER_TOOLS_PREVIEWS_CELLAR_BUCKET ?? DEFAULT_PREVIEW_CELLAR_BUCKET;
  const [accessKeyId, secretAccessKey] = readEnvVars([
    'CC_CLEVER_TOOLS_PREVIEWS_CELLAR_KEY_ID',
    'CC_CLEVER_TOOLS_PREVIEWS_CELLAR_SECRET_KEY',
  ]);
  return new CellarClient({ bucket, accessKeyId, secretAccessKey });
}

/**
 * @returns {CellarClientPublic}
 */
function createCellarClientPublic() {
  const bucket = process.env.CC_CLEVER_TOOLS_PREVIEWS_CELLAR_BUCKET ?? DEFAULT_PREVIEW_CELLAR_BUCKET;
  return new CellarClientPublic({ bucket });
}

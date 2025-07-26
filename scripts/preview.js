#!/usr/bin/env node
//
// Manage preview builds and deployment to Cellar storage.
//
// This script handles the preview workflow for clever-tools binaries:
// - Building previews and installs them locally
// - Publishing built previews to Cellar object storage
// - Updating remote previews with filtering support
// - Deleting previews from remote storage
// - Generating GitHub PR comments with download links
//
// USAGE:
//   preview.js build [preview-name]
//   preview.js publish [preview-name]
//   preview.js update [filter]
//   preview.js delete [preview-name]
//   preview.js pr-comment [preview-name]
//
// ARGUMENTS:
//   command         Command to execute (build|publish|update|delete|pr-comment)
//   [preview-name]  Preview name (e.g., "my-feature"), defaults to current git branch
//   [filter]        Simple glob pattern to filter preview names (e.g., "feature-*")
//
// ENVIRONMENT VARIABLES:
//   CC_CLEVER_TOOLS_PREVIEWS_CELLAR_BUCKET      Preview storage bucket (required for publish/delete)
//   CC_CLEVER_TOOLS_PREVIEWS_CELLAR_KEY_ID      Cellar access key (required for publish/delete)
//   CC_CLEVER_TOOLS_PREVIEWS_CELLAR_SECRET_KEY  Cellar secret key (required for publish/delete)
//
// EXAMPLES:
//   preview.js build
//   preview.js build feature-branch
//   preview.js publish
//   preview.js publish feature-branch
//   preview.js update
//   preview.js update "feature-*"
//   preview.js delete
//   preview.js delete feature-branch
//   preview.js pr-comment feature-branch

import { checkbox } from '@inquirer/prompts';
import dedent from 'dedent';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { styleText } from 'node:util';
import { buildBinary } from './lib/build-binary.js';
import { bundleToSingleCjs } from './lib/bundle-cjs.js';
import { CellarClientPublic } from './lib/cellar-client-public.js';
import { CellarClient } from './lib/cellar-client.js';
import { ArgumentError, readEnvVars, runCommand, UnknownCommandError } from './lib/command.js';
import { createArchive } from './lib/create-archive.js';
import { getLocalDateAndTime } from './lib/datetime.js';
import { fetchWithProgress } from './lib/fetch-with-progress.js';
import { getSha256, readJson, writeJson } from './lib/fs.js';
import { getCurrentAuthor, getCurrentBranch, getCurrentCommit } from './lib/git.js';
import { HtmlPreviews } from './lib/html-previews.js';
import {
  getAssetParts,
  getAssetPath,
  LIST_INDEX_PATH,
  LOCAL_MANIFEST_PATH,
  LOCAL_PREVIEW_DIR,
  REMOTE_MANIFEST_PATH,
} from './lib/paths.js';
import { getEmoji, getOs, SUPPORTED_OS } from './lib/platform-os.js';
import { exec } from './lib/process.js';
import { TerminalTable } from './lib/terminal-table.js';
import { highlight } from './lib/terminal.js';
import { getVersion } from './lib/utils.js';

/**
 * @typedef {import('./lib/common.types.d.ts').OS} OS
 * @typedef {import('./lib/common.types.d.ts').Manifest} Manifest
 * @typedef {import('./lib/common.types.d.ts').Preview} Preview
 * @typedef {import('./lib/common.types.d.ts').PreviewBuild} PreviewBuild
 * @typedef {import('./lib/common.types.d.ts').StyleTextFormat} StyleTextFormat
 */

const DEFAULT_PREVIEW_CELAR_BUCKET = 'clever-tools-preview.clever-cloud.com';

runCommand(async () => {
  const [command, rawFirstArg] = process.argv.slice(2);

  if (command == null || command.length === 0) {
    throw new ArgumentError('command');
  }

  const firstArg =
    command === 'update'
      ? // With update, we're dealing with a filter and the default is "*"
        (rawFirstArg ?? '*')
      : // With other commands, we're dealing with a previewName and the default is the current branch name
        getVersion(rawFirstArg ?? (await getCurrentBranch()));

  const os = getOs();

  switch (command) {
    case 'build': {
      return buildPreview(firstArg, os);
    }
    case 'publish': {
      return publishPreview(firstArg);
    }
    case 'update': {
      return updatePreviews(firstArg, os);
    }
    case 'delete': {
      await deleteRemotePreview(firstArg);
      await deleteLocalPreviews(firstArg);
      return;
    }
    case 'pr-comment': {
      return getPreviewPrComment(firstArg);
    }
  }

  throw new UnknownCommandError(command);
});

/**
 * Builds the clever-tools binary and archive for the specified OS.
 * Creates the necessary directories, bundles to CJS, generates both binary and archive files,
 * and installs the binary locally as a symlink in the preview binaries directory.
 * @param {string} previewName - The name of the preview to build.
 * @param {OS} os - The operating system to build for.
 * @throws {Error} When build fails or required files are missing.
 * @returns {Promise<void>}
 */
async function buildPreview(previewName, os) {
  const binaryParts = getAssetParts('binary', previewName, 'build', os);
  await fs.mkdir(binaryParts.directory, { recursive: true });
  await bundleToSingleCjs(previewName);
  await buildBinary(previewName, os);
  await createArchive(previewName, os);
  await installBinary(previewName, os, false);
}

/**
 * Publishes a built local preview to the remote preview storage.
 * Uploads archives for all available OS builds and updates the manifest.
 * @param {string} previewName - The name of the preview to publish.
 * @throws {Error} When environment variables are missing or upload fails.
 * @returns {Promise<void>}
 */
async function publishPreview(previewName) {
  const cellarClient = createCellarClient();

  /** @type {Preview} */
  const newPreview = {
    builds: {},
    updatedAt: new Date().toISOString(),
    commitId: await getCurrentCommit(),
    author: await getCurrentAuthor(),
  };

  for (const os of SUPPORTED_OS) {
    const localPath = getAssetPath('archive', previewName, 'build', os);
    if (existsSync(localPath)) {
      const remotePath = getAssetPath('archive', previewName, 'preview', os);
      console.log(highlight`=> Upload ${localPath} to ${remotePath}`);
      await cellarClient.upload(localPath, remotePath);
      newPreview.builds[os] = {
        url: cellarClient.getPublicUrl(remotePath),
        checksum: await getSha256(localPath),
      };
    }
  }

  const manifest = await fetchManifest();
  manifest.previews[previewName] = newPreview;

  console.log(highlight`=> Update JSON manifest to ${REMOTE_MANIFEST_PATH}`);
  await updateManifest(cellarClient, manifest);
  console.log(highlight`=> Update HTML list index to ${LIST_INDEX_PATH}`);
  await updateListIndex(cellarClient, manifest);
}

/**
 * Deletes a preview from remote storage and updates the manifest.
 * @param {string} previewName - The exact name of the preview to delete.
 * @throws {Error} When preview is not found or deletion fails.
 * @returns {Promise<void>}
 */
async function deleteRemotePreview(previewName) {
  const cellarClient = createCellarClient();

  const manifest = await fetchManifest();
  const preview = manifest.previews[previewName];
  if (preview == null) {
    throw new Error(highlight`No preview for ${previewName} could be found`);
  }

  const previewDirectory = getAssetParts('archive', previewName, 'preview').directory;
  console.log(highlight`=> Delete ${previewDirectory + '/**'}`);
  await cellarClient.delete(previewDirectory);
  delete manifest.previews[previewName];

  console.log(highlight`=> Update JSON manifest to ${REMOTE_MANIFEST_PATH}`);
  await updateManifest(cellarClient, manifest);
  console.log(highlight`=> Update HTML list index to ${LIST_INDEX_PATH}`);
  await updateListIndex(cellarClient, manifest);
}

/**
 * Deletes the specified preview binaries from the local filesystem.
 * @param {string[]} previewNames - Array of preview names to delete.
 * @throws {Error} When local manifest cannot be read or written.
 * @returns {Promise<void>}
 */
async function deleteLocalPreviews(...previewNames) {
  if (previewNames.length === 0) {
    return;
  }
  const localManifest = await getLocalManifest();
  for (const previewName of previewNames) {
    const thePath = getAssetPath('binary', previewName, 'local');
    console.log(highlight`=> Deleting ${thePath} binary`);
    await fs.rm(thePath, { force: true });
    delete localManifest.previews[previewName];
  }
  console.log(highlight`=> Updating local manifest ${LOCAL_MANIFEST_PATH}`);
  await writeJson(LOCAL_MANIFEST_PATH, localManifest);
}

/**
 * Generates a markdown comment for GitHub PR with preview download links.
 * Outputs the formatted comment to stdout for use in CI/CD pipelines.
 * @param {string} previewName - The name/version of the preview to get comment for.
 * @throws {Error} When no preview is found for the given name.
 * @returns {Promise<void>}
 */
async function getPreviewPrComment(previewName) {
  const manifest = await fetchManifest();
  const preview = manifest.previews[previewName];
  if (preview == null) {
    throw new Error(highlight`No preview for ${previewName} could be found`);
  }

  const links = SUPPORTED_OS.filter((os) => preview.builds[os])
    .map((os) => {
      const build = preview.builds[os];
      const name = `${getEmoji(os)}`;
      const link = `[${os}](${build.url})`;
      const checksum = `\`${build.checksum}\``;
      return `| ${name} ${link} | ${checksum} |`;
    })
    .join('\n');

  // TODO add command example before table
  console.log(dedent`
    🔎 A preview has been automatically published!
  
    If you created the alias to the preview script, you can run this command to download and install this preview:
  
    \`\`\`bash
    clever-update-previews ${previewName}
    \`\`\`
  
    You can also run it from your local repository:
  
    \`\`\`bash
    ./scripts/preview.js update ${previewName}
    \`\`\`
  
    | OS | SHA256 checksum |
    |-|-|
    ${links}
  
    _This preview will be deleted once this PR is closed._
  `);
}

/**
 * Computes the state of a preview by comparing remote and local data.
 * Determines if preview needs downloading, is up-to-date, or has conflicts.
 * @param {Preview} remotePreview - The remote preview data from manifest.
 * @param {Preview|null} localPreview - The local preview data (if exists).
 * @param {OS} os - The operating system to check state for.
 * @returns {'no-build'|'downloading'|'up-to-date'|'updating'|'local-ahead'} The computed state:
 *   - 'no-build': No build available for current OS
 *   - 'downloading': Local preview missing, needs download
 *   - 'up-to-date': Local and remote checksums match
 *   - 'updating': Remote is newer than local
 *   - 'local-ahead': Local is newer than remote
 */
function getPreviewState(remotePreview, localPreview, os) {
  const remoteBuild = remotePreview.builds[os];

  if (!remoteBuild) {
    return 'no-build';
  }
  if (!localPreview) {
    return 'downloading';
  }
  const localBuild = localPreview.builds[os];
  if (!localBuild) {
    return 'downloading';
  }
  if (remoteBuild.checksum === localBuild.checksum) {
    return 'up-to-date';
  }
  if (remotePreview.updatedAt > localPreview.updatedAt) {
    return 'updating';
  }
  return 'local-ahead';
}

/**
 * Updates local previews by downloading from remote storage.
 * Compares remote and local manifest states, downloads newer versions,
 * and displays progress in a terminal table.
 * @param {string} filter - Glob-like filter for preview names (e.g., "feature-*").
 * @param {OS} os - The operating system to update previews for.
 * @throws {Error} When fetching manifest fails.
 * @returns {Promise<void>}
 */
async function updatePreviews(filter, os) {
  const remoteManifest = await fetchManifest();
  const localManifest = await getLocalManifest();

  /** @type {Array<[string, StyleTextFormat]>} */
  const columns = [
    ['NAME', 'green'],
    ['DATE', 'none'],
    ['TIME', 'none'],
    ['COMMIT ID', 'yellow'],
    ['AUTHOR', 'blue'],
    ['STATE' + ' '.repeat(20), 'none'],
  ];

  /** @type {Array<[string, Preview, string]>} */
  const filteredRemotePreviews = Object.entries(remoteManifest.previews)
    .filter(([previewName]) => matchFilter(filter, previewName))
    .toSorted(([aName], [bName]) => aName.localeCompare(bName))
    .map(([previewName, preview]) => {
      const localPreview = localManifest.previews[previewName];
      const state = getPreviewState(preview, localPreview, os);
      return [previewName, preview, state];
    });

  const rows = filteredRemotePreviews.map(([previewName, preview]) => {
    const [dateStr, timeStr] = getLocalDateAndTime(preview.updatedAt);
    const commitId = preview.commitId.substring(0, 7);
    const author = preview.author;
    return [previewName, dateStr, timeStr, commitId, author, ''];
  });

  // Init table without empty states
  const table = new TerminalTable(columns, rows);
  table.renderInit();

  // Update state table column to display state details
  // Start actions appropriate with states (like downloading) and update state table cells
  const lastColumnIndex = columns.length - 1;
  await Promise.all(
    filteredRemotePreviews.map(([previewName, preview, state], rowIdex) => {
      switch (state) {
        case 'no-build':
          return table.updateData(rowIdex, lastColumnIndex, 'No build for this OS', 'gray');
        case 'downloading':
        case 'updating':
          return downloadPreview(previewName, preview, os, (state, style) => {
            table.updateData(rowIdex, lastColumnIndex, state, style);
          });
        case 'up-to-date':
          return table.updateData(rowIdex, lastColumnIndex, 'Up to date', 'green');
        case 'local-ahead':
          return table.updateData(rowIdex, lastColumnIndex, 'Local preview is ahead', 'magenta');
        default:
          return table.updateData(rowIdex, lastColumnIndex, 'Unknown', 'gray');
      }
    }),
  );

  // Update local manifest now that we installed many previews
  for (const [previewName, preview] of filteredRemotePreviews) {
    localManifest.previews[previewName] = preview;
  }
  if (filteredRemotePreviews.length > 0) {
    await fs.mkdir(LOCAL_PREVIEW_DIR, { recursive: true });
    await writeJson(LOCAL_MANIFEST_PATH, localManifest);
  }

  // Try to find local previews that aren't on the remote server to suggest deletion
  const localOnlyPreviewNames = Object.keys(localManifest.previews).filter((previewName) => {
    return !remoteManifest.previews[previewName];
  });

  if (localOnlyPreviewNames.length > 0) {
    const choices = localOnlyPreviewNames.map((previewName) => ({
      name: previewName,
      value: previewName,
      checked: true,
    }));
    const selectedPreviews = await checkbox({
      message: 'Select local previews to delete:',
      choices,
    });
    const localOnlyPreviewNamesToDelete = localOnlyPreviewNames.filter((previewName) => {
      return selectedPreviews.includes(previewName);
    });

    await deleteLocalPreviews(...localOnlyPreviewNamesToDelete);
  }

  // Display tip to add preview binaries directory
  if (!process.env.PATH?.includes(LOCAL_PREVIEW_DIR)) {
    const pathToAdd = import.meta.dirname.replace(process.env.HOME ?? '~', '~') + '/' + LOCAL_PREVIEW_DIR;
    console.log();
    console.log(dedent`
      💡 ${styleText('yellow', 'TIP:')} Add preview binaries to your PATH:
         ${styleText('blue', `export PATH="${pathToAdd}:$PATH"  # for bash, zsh...`)}
         ${styleText('blue', `fish_add_path ${pathToAdd}        # for fish`)}
    `);
  }
}

/**
 * Downloads a preview binary from the remote storage,
 * extracts it, installs it locally,
 * and updates the preview state.
 * @param {string} previewName - The name of the preview to download.
 * @param {Preview} preview - The preview object containing URLs and metadata.
 * @param {OS} os - The operating system for which to download the preview.
 * @param {function(string, StyleTextFormat): void} updateState - Callback to update the state message.
 * @throws {Error} When download or extraction fails.
 * @returns {Promise<void>}
 */
async function downloadPreview(previewName, preview, os, updateState) {
  const previewUrl = preview.builds[os];

  try {
    updateState('Downloading .tar.gz…', 'yellow');
    const [downloadBuffer, downloadError] = await fetchWithProgress(previewUrl.url, (message) => {
      return updateState(message, 'yellow');
    })
      .then((result) => [result])
      .catch((err) => [null, err]);
    if (downloadError != null) {
      return updateState(downloadError.message, 'red');
    }
    const tarPath = getAssetParts('archive', previewName, 'build', os);
    await fs.mkdir(tarPath.directory, { recursive: true });
    await fs.writeFile(`${tarPath.directory}/${tarPath.filename}`, downloadBuffer);

    updateState('Extracting .tar.gz…', 'yellow');
    await exec(`tar -xzf ${tarPath.filename}`, { cwd: tarPath.directory, quiet: true });

    updateState('Installing binary…', 'yellow');
    await installBinary(previewName, os, true);

    updateState('Up to date', 'green');
  } catch (error) {
    updateState(`Error: ${error.message}`, 'red');
  }
}

/**
 * Installs the built binary to the local preview binaries directory.
 * Copies the binary to the local preview directory and updates the local manifest.
 * @param {string} previewName - The name of the preview to install.
 * @param {OS} os - The operating system for which to install the binary.
 * @param {boolean} quiet - Whether to suppress output messages.
 * @throws {Error} When installation fails or required files are missing.
 * @returns {Promise<void>}
 */
async function installBinary(previewName, os, quiet) {
  const source = getAssetPath('binary', previewName, 'build', os);
  const archive = getAssetPath('archive', previewName, 'build', os);
  const destinationParts = getAssetParts('binary', previewName, 'local');
  const destination = `${destinationParts.directory}/${destinationParts.filename}`;
  if (!quiet) {
    console.log(highlight`=> Install ${previewName} to ${destination}`);
  }
  await fs.mkdir(destinationParts.directory, { recursive: true });
  await fs.cp(source, destination);

  const newPreview = {
    builds: {
      [os]: {
        url: 'http://localhost',
        checksum: await getSha256(archive),
      },
    },
    updatedAt: new Date().toISOString(),
    commitId: await getCurrentCommit(),
    author: await getCurrentAuthor(),
  };

  const localManifest = await getLocalManifest();
  localManifest.previews[previewName] = newPreview;
  await writeJson(LOCAL_MANIFEST_PATH, localManifest);
}

/**
 * Retrieves the preview manifest from storage.
 * Returns a default manifest if none exists.
 * @returns {Promise<Manifest>} The manifest object containing all previews.
 */
async function fetchManifest() {
  const cellarClient = createCellarClientPublic();
  try {
    const manifestJson = await cellarClient.getObject(REMOTE_MANIFEST_PATH);
    /** @type {Manifest} */
    const manifest = JSON.parse(manifestJson);
    return manifest;
  } catch (error) {
    // Log error for debugging, but continue with default manifest
    if (error?.statusCode === 404) {
      console.error(`Manifest not found at ${REMOTE_MANIFEST_PATH}, creating default manifest`);
    } else {
      console.error(`Error fetching manifest from ${REMOTE_MANIFEST_PATH}:`, error?.message || error);
    }
    return createDefaultManifest();
  }
}

/**
 * Reads the local manifest from the filesystem.
 * If the file does not exist, it creates a default manifest.
 * @returns {Promise<Manifest>} The local manifest object.
 * @throws {Error} When the manifest file cannot be read or parsed.
 */
async function getLocalManifest() {
  return readJson(LOCAL_MANIFEST_PATH)
    .catch(() => createDefaultManifest())
    .then((rawManifest) => /** @type {Manifest} */ (rawManifest));
}

/**
 * Creates a default empty manifest structure.
 * @returns {Manifest} An empty manifest with version and empty previews array.
 */
function createDefaultManifest() {
  return {
    version: '1',
    previews: {},
  };
}

/**
 * Updates the preview manifest in storage.
 * @param {CellarClient} cellarClient - The authenticated cellar client instance.
 * @param {Manifest} manifest - The manifest object to store.
 * @returns {Promise<void>}
 * @throws {Error} When the update fails.
 */
async function updateManifest(cellarClient, manifest) {
  const manifestJson = JSON.stringify(manifest, null, '  ');
  return cellarClient.putObject(manifestJson, REMOTE_MANIFEST_PATH);
}

/**
 * Updates the HTML index page that lists all previews.
 * Generates a formatted HTML table with preview information.
 * @param {CellarClient} cellarClient - The authenticated cellar client instance.
 * @param {Manifest} manifest - The manifest containing preview data.
 * @returns {Promise<void>}
 */
async function updateListIndex(cellarClient, manifest) {
  const htmlPreviews = new HtmlPreviews(manifest);
  return cellarClient.putObject(htmlPreviews.render(), LIST_INDEX_PATH);
}

/**
 * Creates and configures a public (non-authenticated) Cellar client instance.
 * Used for read-only operations like fetching manifests.
 * @returns {CellarClientPublic} The configured public Cellar client instance.
 */
function createCellarClientPublic() {
  // Rare situation where we have a default and we don't fail on missing env var so contributors and update previews without any config
  const bucket = process.env.CC_CLEVER_TOOLS_PREVIEWS_CELLAR_BUCKET ?? DEFAULT_PREVIEW_CELAR_BUCKET;
  return new CellarClientPublic({ bucket });
}

/**
 * Creates and configures an authenticated Cellar client instance.
 * Used for write operations like uploading files and updating manifests.
 * @returns {CellarClient} The configured authenticated Cellar client instance.
 * @throws {Error} When required environment variables are missing.
 */
function createCellarClient() {
  const [bucket, accessKeyId, secretAccessKey] = readEnvVars([
    'CC_CLEVER_TOOLS_PREVIEWS_CELLAR_BUCKET',
    'CC_CLEVER_TOOLS_PREVIEWS_CELLAR_KEY_ID',
    'CC_CLEVER_TOOLS_PREVIEWS_CELLAR_SECRET_KEY',
  ]);
  return new CellarClient({
    bucket,
    accessKeyId,
    secretAccessKey,
  });
}

/**
 * Checks if a string matches a glob pattern.
 * @param {string} pattern
 * @param {string} string
 * @returns {boolean}
 */
export function matchFilter(pattern, string) {
  if (pattern.includes('*')) {
    const regexPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(string);
  }
  return pattern === string;
}

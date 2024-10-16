#!/usr/bin/env node

import fs from 'fs-extra';
import colors from 'colors/safe.js';
import textTable from 'text-table';
import * as cfg from './config.js';
import { build } from './build.js';
import { archive } from './archive.js';
import { getArchiveFilename, getWorkingDirectory, getArchiveFilepath, getShaFilepath } from './paths.js';
import { getCurrentBranch, cleanupDirectory, getCurrentAuthor, getCurrentCommit } from './utils.js';
import { getCellarClient } from './cellar-client.js';
import { archEmoji } from './config.js';

const { archList } = cfg;

const REMOTE_PREVIEW_DIR = 'previews';

async function run () {
  const [command, branch] = process.argv.slice(2);

  if (command == null || command.length === 0) {
    throw new Error('Missing argument \'command\'');
  }

  const previewName = () => (branch ?? getCurrentBranch()).replace(/\//g, '-');

  switch (command) {
    case 'get':
      return getPreview(previewName());
    case 'links':
      return getPreviewLinks(previewName());
    case 'list':
      return listPreviews();
    case 'build':
      return buildPreview(previewName());
    case 'publish':
      return publishPreview(previewName());
    case 'delete':
      return deletePreview(previewName());
  }

  throw new Error('Unknown command!');
}

async function buildPreview (previewName) {
  await cleanupDirectory(getWorkingDirectory(previewName));

  await build(previewName);
  await archive(previewName, false);
}

async function publishPreview (previewName) {
  const cellarClient = cellar();

  for (const arch of archList) {
    const archiveFilepath = getArchiveFilepath(arch, previewName);
    const remoteFilepath = getArchiveRemoteFilepath(arch, previewName);
    await cellarClient.upload(archiveFilepath, remoteFilepath);
    await cellarClient.upload(getShaFilepath(archiveFilepath), getShaFilepath(remoteFilepath));
  }

  const checksums = {};
  for (const arch of archList) {
    const archiveFilepath = getArchiveFilepath(arch, previewName);
    checksums[arch] = await fs.readFile(getShaFilepath(archiveFilepath), 'utf-8');
  }

  const manifest = await getManifest();
  const newPreview = {
    name: previewName,
    urls: archList.map((arch) => {
      const archiveRemoteFilepath = getArchiveRemoteFilepath(arch, previewName);
      const shaRemoteFilepath = getShaFilepath(archiveRemoteFilepath);
      return ({
        arch,
        url: cellarClient.url(archiveRemoteFilepath),
        checksum: {
          type: 'sha256',
          url: cellarClient.url(shaRemoteFilepath),
          value: checksums[arch],
        },
      });
    }),
    updatedAt: new Date().toISOString(),
    commitId: getCurrentCommit(),
    author: getCurrentAuthor(),
  };
  const previewIndex = manifest.previews.findIndex((p) => p.name === previewName);
  if (previewIndex !== -1) {
    manifest.previews[previewIndex] = newPreview;
  }
  else {
    manifest.previews.push(newPreview);
  }

  await updateManifest(manifest);
  await updateListIndex(manifest);
}

async function deletePreview (previewName) {
  const manifest = await getManifest();
  const previewIndex = manifest.previews.findIndex((p) => p.name === previewName);
  if (previewIndex === -1) {
    console.log(`No preview "${previewName}" found.`);
    return;
  }

  await cellar().delete(getArchiveRemoteDirectory(previewName));

  manifest.previews = manifest.previews.filter((p) => p.name !== previewName);

  await updateManifest(manifest);
  await updateListIndex(manifest);
}

async function getPreview (previewName) {
  const manifest = await getManifest();

  const preview = manifest.previews.find((p) => p.name === previewName);

  if (preview == null) {
    console.log(`No preview for "${previewName}" could be found.`);
    process.exit(1);
  }
  else {
    console.log(textTable([previewToPrintableDetails(preview)]));
  }
}

async function getPreviewLinks (previewName) {
  const manifest = await getManifest();

  const preview = manifest.previews.find((p) => p.name === previewName);

  if (preview == null) {
    console.log(`No preview for "${previewName}" could be found.`);
    process.exit(1);
  }
  else {
    const markdown = preview.urls.map((u) => {
      const name = `${archEmoji[u.arch]}`;
      const link = `[${u.arch}](${u.url})`;
      const checksum = `\`${u.checksum.value}\``;
      return `* ${name} ${link} ${checksum}`;
    }).join('\n');
    console.log(markdown);
  }
}

async function listPreviews () {
  const manifest = await getManifest();
  if (manifest.previews.length === 0) {
    console.log('No previews right now.');
  }
  else {
    const table = manifest.previews.map((p) => previewToPrintableDetails(p));
    console.log(textTable(table));
  }
}

run().catch((e) => {
  console.error(e);
  console.log('Available commands are: get [branch?], list, links [branch?], build [branch?], publish [branch?], delete [branch?]');
  process.exit(1);
});

// ----------

function cellar () {
  return getCellarClient('previews');
}

function getArchiveRemoteFilepath (arch, name) {
  return `${getArchiveRemoteDirectory(name)}/${getArchiveFilename(arch, name)}`;
}

function getArchiveRemoteDirectory (name) {
  return `${REMOTE_PREVIEW_DIR}/${name}`;
}

async function getManifest () {
  const cellarClient = cellar();

  try {
    return await cellarClient.getObject(`${REMOTE_PREVIEW_DIR}/manifest.json`);
  }
  catch (e) {
    if (e.code === 'NoSuchKey') {
      return {
        version: '1',
        previews: [],
      };
    }
    throw e;
  }
}

async function updateManifest (manifest) {
  const cellarClient = cellar();

  const manifestJson = JSON.stringify(manifest, null, '  ');
  return cellarClient.putObject(manifestJson, `${REMOTE_PREVIEW_DIR}/manifest.json`);
}

async function updateListIndex (manifest) {
  const cellarClient = cellar();

  const indexHtml = `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Clever tools - Previews</title>
      <style>
        body {
          margin: 0 auto;
          font-family: Arial, sans-serif;
          width: 100%;
          max-width: 85em;
        }
        code {
          font-family: "SourceCodePro", "monaco", monospace;
          font-size: 1em;
        }
        table {
          width: 100%;
        }
        th {
          text-align: left;
        }
        th,
        td {
          padding: 0.25em 0;
        }
        .binaries {
          display: grid;
          grid-template-columns: max-content auto;
          column-gap: 0.2em;
          align-items: center;
        }
        .binaries code {
          font-size: 0.8em;
          color: grey;
        }
      </style>
      <script src="https://components.clever-cloud.com/load.js?components=cc-datetime-relative" type="module"></script>
    </head>
    <body>
    <h1>Clever tools - Previews</h1>
    ${manifest.previews.length === 0
? `
      <p><em>No previews right now</em></p>
    `
: `
      <table>
        <tr>
          <th>Branch</th>
          <th>Binaries</th>
          <th>Updated</th>
          <th>Commit ID</th>
          <th>Author</th>
        </tr>
        ${manifest.previews.map((p) => `
          <tr>
            <td><code>${p.name}</td>
            <td>
              <div class="binaries">
                ${p.urls.map((u) => {
                  const url = `<a href="${u.url}">${archEmoji[u.arch]} ${u.arch}</a>`;
                  const checksum = `<code>${u.checksum.value}</code></span>`;
                  return `${url}${checksum}`;
                }).join('')}
              </div>
            </td>
            <td><cc-datetime-relative datetime="${p.updatedAt}">${p.updatedAt}</cc-datetime-relative></td>
            <td><span title="${p.commitId}">${p.commitId.substring(0, 8)}</span></td>
            <td>${p.author}</td>
          </tr>
        `).join('\n')}
      </table>
    `}
    </body>
    </html>
  `;
  return cellarClient.putObject(indexHtml, `${REMOTE_PREVIEW_DIR}/index.html`);
}

function previewToPrintableDetails (p) {
  return [
    ...p.updatedAt.substring(0, 19).split('T'),
    colors.red(p.commitId.substring(0, 8)),
    colors.yellow(p.name),
    colors.green(p.author),
    p.urls.map((u) => {
      const name = `${archEmoji[u.arch]} ${colors.bold(u.arch.padEnd(5, ' '))}`;
      const link = `${u.url}`;
      const checksum = colors.gray(`${u.checksum.type}: ${u.checksum.value}`);

      return colors.blue(`\n   ${name}: ${link}\n      ${checksum}`);
    }).join(''),
  ];
}

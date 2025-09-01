import dedent from 'dedent';
import { getEmoji, SUPPORTED_OS } from './platform-os.js';

/**
 * @typedef {import('./common.types.js').OS} OS
 * @typedef {import('./common.types.js').Manifest} Manifest
 * @typedef {import('./common.types.js').Preview} Preview
 * @typedef {import('./common.types.js').PreviewBuild} PreviewBuild
 */

export class HtmlPreviews {
  #manifest;

  /**
   * @param {Manifest} manifest - The manifest object containing preview information.
   */
  constructor(manifest) {
    this.#manifest = manifest;
  }

  /**
   * Renders the HTML for the preview page.
   * @returns {string} The HTML string for the preview page.
   */
  render() {
    // language=HTML
    return dedent`
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="icon" href="data:image/x-icon;base64,AA">
        <title>Clever tools - Previews</title>
        <style>
        body {
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
          max-width: 65em;
          background-color: #f6f8fa;
          padding: 1em;
        }

        h1 {
          color: #1f2328;
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 1em;
        }

        a {
          color: #0969da;
          text-decoration: none;
          font-weight: 500;
        }

        a:hover {
          text-decoration: underline;
        }

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background-color: #ffffff;
          border: 1px solid #d1d9e0;
          border-radius: 0.375em;
          overflow: hidden;
        }

        tr:hover {
          background-color: #f6f8fa;
        }

        thead tr,
        tbody tr:first-child {
          background-color: #f6f8fa;
        }

        th,
        td {
          font-size: 0.9em;
          border-bottom: 1px solid #d1d9e0;
          padding-inline: 1em;
        }

        th.right,
        td.right {
          text-align: right;
        }

        th {
          text-align: left;
          font-weight: bold;
          color: #656d76;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background-color: #f6f8fa;
          padding-block: 0.75em;
        }

        td {
          padding-block: 0.5em;
          color: #1f2328;
        }

        tr:last-child td {
          border-bottom: none;
        }

        cc-datetime-relative {
          color: #656d76;
          font-size: 0.9em;
        }

        code {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
          font-size: 0.9em;
          background-color: #f6f8fa;
          padding: 0.125em 0.375em;
          border-radius: 0.375em;
          color: #1f2328;
          border: 1px solid #d1d9e0;
        }

        code.commit {
          color: #0969da;
        }

        /* Dirty alignment hack */
        code.commit,
        code.branch {
          position: relative;
          top: -0.1875em;
        }

        .binaries {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625em;
          /* Dirty alignment hack */
          position: relative;
          left: -0.1875em;
        }

        .empty-message {
          background-color: #ffffff;
          border: 1px solid #333;
          border-radius: 0.375em;
          padding: 2em;
          text-align: center;
          color: #656d76;
          font-style: italic;
          font-size: 0.875em;
        }
        </style>
        <script src="https://components.clever-cloud.com/load.js?components=cc-datetime-relative" type="module"></script>
      </head>
      <body>
      <h1>Clever tools - Previews</h1>
      ${this.#renderManifest()}
      </body>
      </html>
    `;
  }

  /**
   * Renders a single preview row in the table.
   * @return {string}
   */
  #renderManifest() {
    if (Object.keys(this.#manifest.previews).length === 0) {
      return `<div class="empty-message">No previews right now</div>`;
    }

    return dedent`
    <table>
      <tr>
        <th>Branch</th>
        <th>Commit ID</th>
        <th class="right">Updated</th>
        <th>Author</th>
        <th>Binaries</th>
      </tr>
      ${Object.entries(this.#manifest.previews)
        .map(([name, preview]) => this.#renderPreview(name, preview))
        .join('\n')}
    </table>
  `;
  }

  /**
   * Renders a single preview row in the HTML index.
   * @param {string} name
   * @param {Preview} preview
   * @return {string}
   */
  #renderPreview(name, preview) {
    const builds = SUPPORTED_OS.filter((os) => preview.builds[os])
      .map((os) => this.#renderPreviewBuild(os, preview.builds[os]))
      .join('');
    return dedent`
    <tr>
      <td><code class="branch"><a href="https://github.com/CleverCloud/clever-tools/tree/${name}">${name}</a></code></td>
      <td><code class="commit" title="${preview.commitId}"><a href="https://github.com/CleverCloud/clever-tools/commit/${preview.commitId}">${preview.commitId.substring(0, 8)}</a></code></td>
      <td class="right"><cc-datetime-relative datetime="${preview.updatedAt}">${preview.updatedAt}</cc-datetime-relative></td>
      <td><span>${preview.author}</span></td>
      <td>
        <div class="binaries">
          ${builds}
        </div>
      </td>
    </tr>
  `;
  }

  /**
   * Renders a single preview URL in the HTML index.
   * @param {OS} os
   * @param {PreviewBuild} build
   * @return {string}
   */
  #renderPreviewBuild(os, build) {
    return dedent`
    <span title="${build.checksum}">
      ${getEmoji(os)}&nbsp;<a href="${build.url}">${os}</a>
    </span>
  `;
  }
}

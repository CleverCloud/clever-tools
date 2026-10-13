import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

/**
 * @typedef {import('mdast').Root} MdastRoot
 * @typedef {import('mdast').RootContent} MdastRootContent
 * @typedef {import('mdast').Heading} MdastHeading
 * @typedef {import('mdast').Node} MdastNode
 */

/**
 * Parses markdown content into an AST.
 * @param {string} content
 * @returns {MdastRoot}
 */
export function parseMarkdown(content) {
  return unified().use(remarkParse).parse(content);
}

/**
 * Stringifies a markdown AST node.
 * @param {MdastRoot | MdastRootContent | { type: 'root', children: MdastRootContent[] }} node
 * @returns {string}
 */
export function stringifyMarkdown(node) {
  // @ts-expect-error - unified stringify accepts any mdast node but types are strict
  return unified().use(remarkStringify).stringify(node).trim();
}

/**
 * Extracts nodes between an H2 starting with the heading prefix and the next H2 (or end of doc).
 * Matching on a prefix lets the end of the heading (like a version badge) change between runs.
 * @param {MdastRootContent[]} children
 * @param {string} headingPrefix - The expected start of the H2 heading text, up to a space or the end
 * @returns {MdastRootContent[]}
 */
export function getNodesBetweenH2(children, headingPrefix) {
  let startIndex = -1;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.type === 'heading' && node.depth === 2) {
      const parsedHeading = stringifyMarkdown(node);
      if (parsedHeading === headingPrefix || parsedHeading.startsWith(`${headingPrefix} `)) {
        startIndex = i + 1;
      } else if (startIndex !== -1) {
        // Next H2 found, return slice
        return children.slice(startIndex, i);
      }
    }
  }

  // If we found start but no next H2, return until end
  if (startIndex !== -1) {
    return children.slice(startIndex);
  }

  return [];
}

/**
 * Escapes pipe characters and newlines for markdown tables.
 * @param {string} str
 * @returns {string}
 */
export function escapeTableCell(str) {
  if (str == null) {
    return '-';
  }
  return String(str).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Formats a list of items as inline code.
 * @param {string[]} items
 * @returns {string}
 */
export function formatCodeList(items) {
  return items.map((item) => `\`${item}\``).join(', ');
}

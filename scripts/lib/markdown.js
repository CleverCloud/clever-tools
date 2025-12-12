import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

/**
 * @typedef {import('mdast').Root} MdastRoot
 * @typedef {import('mdast').RootContent} MdastRootContent
 * @typedef {import('mdast').Heading} MdastHeading
 */

/**
 * Parses markdown content into an AST.
 * @param {string} content
 * @return {MdastRoot}
 */
export function parseMarkdown(content) {
  return unified().use(remarkParse).parse(content);
}

/**
 * Stringifies a markdown AST node.
 * @param {MdastRoot | MdastHeading | { type: 'root', children: MdastRootContent[] }} node
 * @return {string}
 */
export function stringifyMarkdown(node) {
  return unified().use(remarkStringify).stringify(node).trim();
}

/**
 * Extracts nodes between an H2 matching the heading and the next H2 (or end of doc).
 * @param {MdastRootContent[]} children
 * @param {string} generatedHeading - The expected H2 heading text
 * @return {MdastRootContent[]}
 */
export function getNodesBetweenH2(children, generatedHeading) {
  let startIndex = -1;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.type === 'heading' && node.depth === 2) {
      const parsedHeading = stringifyMarkdown(node);
      if (parsedHeading === generatedHeading) {
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

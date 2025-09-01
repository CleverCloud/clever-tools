import fs from 'node:fs/promises';
import path from 'node:path';
import { globSync } from 'tinyglobby';
import { highlight } from './terminal.js';

/**
 * Simple template engine that replaces <%= variable %> patterns with values.
 * This is a lightweight alternative to lodash template for basic variable substitution.
 *
 * @param {string} template - Template string containing <%= variable %> patterns
 * @param {Record<string, string>} variables - Object mapping variable names to replacement values
 * @returns {string} Template with variables replaced
 */
function applyTemplate(template, variables) {
  return template.replace(/<%= (.*?) %>/g, (_, variableName) => {
    if (typeof variables[variableName] !== 'string') {
      throw new Error(`Missing template variable ${variableName}`);
    }
    return variables[variableName];
  });
}

/**
 * Applies all template files from a directory to a destination directory.
 *
 * Recursively processes all files in the templates directory, applying variable
 * substitution to each file and writing the results to the destination directory.
 *
 * @param {string} destPath - Destination directory where processed templates will be written
 * @param {string} templatesPath - Source directory containing template files
 * @param {Record<string, any>} templateData - Variables to substitute in templates
 * @returns {Promise<void>}
 */
export async function applyTemplates(destPath, templatesPath, templateData) {
  const filenames = globSync('**/*', { dot: true, cwd: templatesPath, onlyFiles: true });
  for (const file of filenames) {
    const templateFilepath = `${templatesPath}/${file}`;
    const destFilepath = `${destPath}/${file}`;
    await applyOneTemplate(destFilepath, templateFilepath, templateData);
  }
}

/**
 * Writes a string to a file, creating directories as needed.
 *
 * Creates the parent directory structure if it doesn't exist before
 * writing the content to the specified file path.
 *
 * @param {string} content - Content to write to the file
 * @param {string} destFilepath - Path where the file should be written
 * @returns {Promise<void>}
 */
export async function writeStringToFile(content, destFilepath) {
  await fs.mkdir(path.dirname(destFilepath), { recursive: true });
  await fs.writeFile(destFilepath, content);
}

/**
 * Applies a single template file with variable substitution.
 *
 * Reads a template file, performs variable substitution using the provided data,
 * and writes the processed content to the destination file path.
 *
 * @param {string} destFilepath - Path where the processed template will be written
 * @param {string} templateFilepath - Path to the template file to process
 * @param {Record<string, string>} templateData - Variables to substitute in the template
 * @returns {Promise<void>}
 */
export async function applyOneTemplate(destFilepath, templateFilepath, templateData) {
  console.log(highlight`=> Applying template ${templateFilepath} to ${destFilepath}`);
  const template = await fs.readFile(templateFilepath, 'utf-8');
  const contents = applyTemplate(template, templateData);
  await writeStringToFile(contents, destFilepath);
}

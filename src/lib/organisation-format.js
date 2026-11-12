import { styleText } from './style-text.js';

/**
 * Format an organisation as `<name> (<id>)`, plain by default, for error messages and other unstyled text.
 * @param {{ id: string, name: string }} organisation
 * @param {Object} [styles] - Functions applied to each part of the label, the identity by default
 * @param {(name: string) => string} [styles.name] - Applied to the name
 * @param {(id: string) => string} [styles.id] - Applied to the ID, parentheses included
 * @returns {string}
 */
export function formatOrganisationLabel(organisation, { name = (value) => value, id = (value) => value } = {}) {
  return `${name(organisation.name)} ${id(`(${organisation.id})`)}`;
}

/**
 * Format an organisation as `<name> (<id>)`, the name in bold and the ID in grey, for human output.
 * @param {{ id: string, name: string }} organisation
 * @returns {string}
 */
export function formatOrganisation(organisation) {
  return formatOrganisationLabel(organisation, {
    name: (name) => styleText('bold', name),
    id: (id) => styleText('grey', id),
  });
}

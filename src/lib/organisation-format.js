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

/**
 * @param {string} vatNumber
 * @param {string | null} vatState
 * @returns {string} The VAT number, followed by its state when the API gives one
 */
export function formatVatNumber(vatNumber, vatState) {
  return isEmpty(vatState) ? vatNumber : `${vatNumber} (${vatState})`;
}

/**
 * @param {string | null | undefined} value
 * @returns {boolean} Whether the value is missing or an empty string, as the API returns both for an unset field
 */
export function isEmpty(value) {
  return value == null || value === '';
}

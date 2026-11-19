import { get as getOrganisation, update as updateOrganisation } from '@clevercloud/client/esm/api/v2/organisation.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { organisationUpdateError } from '../../lib/organisation-errors.js';
import {
  formatCountry,
  formatOrganisation,
  formatOrganisationLabel,
  formatVatNumber,
  isEmpty,
} from '../../lib/organisation-format.js';
import { promptText } from '../../lib/prompts.js';
import { Logger } from '../../logger.js';
import { resolveOrganisation } from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { orgaIdOrNameArg } from '../global.args.js';

const CLEAR_KEYWORD = '-';

/** Fields printed when they change, in this order: raw API key and label. */
const DIFF_FIELDS = [
  ['name', 'Name'],
  ['description', 'Description'],
  ['customerFullName', 'Billing name'],
  ['billingEmail', 'Billing email'],
  ['company', 'Company'],
  ['VAT', 'VAT number'],
  ['address', 'Address'],
  ['city', 'City'],
  ['zipcode', 'Zipcode'],
  ['countryCode', 'Country'],
];

export const orgsUpdateCommand = defineCommand({
  description: 'Update the details of an organisation',
  since: '5.5.0',
  options: {
    name: defineOption({
      name: 'name',
      schema: z.string().min(1, 'Cannot be empty').optional(),
      description: 'Organisation name',
      placeholder: 'name',
    }),
    description: defineOption({
      name: 'description',
      schema: z.string().min(1, 'Cannot be empty').optional(),
      description: 'Organisation description',
      placeholder: 'description',
    }),
    billingName: defineOption({
      name: 'billing-name',
      schema: z.string().optional(),
      description: 'Billing contact name',
      placeholder: 'billing-name',
    }),
    billingEmail: defineOption({
      name: 'billing-email',
      schema: z.string().optional(),
      description: 'Email receiving the invoices',
      placeholder: 'billing-email',
    }),
    address: defineOption({
      name: 'address',
      schema: z.string().optional(),
      description: 'Billing address',
      placeholder: 'address',
    }),
    city: defineOption({
      name: 'city',
      schema: z.string().optional(),
      description: 'Billing city',
      placeholder: 'city',
    }),
    zipcode: defineOption({
      name: 'zipcode',
      schema: z.string().optional(),
      description: 'Billing zipcode',
      placeholder: 'zipcode',
    }),
    country: defineOption({
      name: 'country',
      schema: z
        .string()
        .regex(/^([a-z]{2})?$/i, 'Use a two-letter ISO country code (e.g.: FR)')
        .transform((value) => value.toUpperCase())
        .optional(),
      description: 'Billing country, as a two-letter ISO code (e.g.: FR)',
      placeholder: 'country-code',
    }),
    company: defineOption({
      name: 'company',
      schema: z.string().optional(),
      description: 'Company name',
      placeholder: 'company',
    }),
    vatNumber: defineOption({
      name: 'vat-number',
      schema: z.string().optional(),
      description: 'VAT number, requires a company',
      placeholder: 'vat-number',
    }),
  },
  args: [orgaIdOrNameArg],
  async handler(options, orgaIdOrName) {
    let { name, description, billingName, billingEmail, address, city, zipcode, country, company, vatNumber } = options;

    const values = [name, description, billingName, billingEmail, address, city, zipcode, country, company, vatNumber];
    const interactive = values.every((value) => value == null);
    if (interactive && !process.stdin.isTTY) {
      throw new Error('No option provided, nothing to update');
    }

    const organisation = await resolveOrganisation(orgaIdOrName);
    const orgaLabel = formatOrganisationLabel(organisation);
    const current = await getOrganisation({ id: organisation.id }).then(sendToApi);

    if (interactive) {
      Logger.println(`Updating ${orgaLabel}. Press Enter to keep a value, type ${CLEAR_KEYWORD} to clear it.`);
      name = await promptField('Name', current.name, {
        validate: (value) => value !== CLEAR_KEYWORD || 'The name cannot be cleared',
      });
      description = await promptField('Description', current.description, {
        validate: (value) => value !== CLEAR_KEYWORD || 'The description cannot be cleared',
      });
      billingName = await promptField('Billing name', current.customerFullName);
      billingEmail = await promptField('Billing email', current.billingEmail);
      company = await promptField('Company', current.company);
      vatNumber = await promptField('VAT number', current.VAT);
      address = await promptField('Address', current.address);
      city = await promptField('City', current.city);
      zipcode = await promptField('Zipcode', current.zipcode);
      country = await promptField('Country code', current.countryCode, {
        validate: (value) =>
          /^[a-z]{2}$/i.test(value) || value === CLEAR_KEYWORD || 'Use a two-letter ISO country code',
      });
      country = country?.toUpperCase();
    }

    // The API erases every key missing from the body: send them all, built from the current state.
    const body = {
      name: name ?? current.name,
      description: description ?? current.description,
      address: clearable(address, current.address),
      city: clearable(city, current.city),
      zipcode: clearable(zipcode, current.zipcode),
      country: clearable(country, current.countryCode),
      company: clearable(company, current.company),
      VAT: clearable(vatNumber, current.VAT),
      customerFullName: clearable(billingName, current.customerFullName),
      billingEmail: clearable(billingEmail, current.billingEmail),
    };

    // The API silently drops a VAT number without a company
    if (!isEmpty(body.VAT) && isEmpty(body.company)) {
      const hint = isEmpty(vatNumber) ? ', or clear both with --company "" --vat-number ""' : '';
      throw new Error(`--vat-number requires a company, set --company too${hint}`);
    }

    // An identical update would still publish an edition event on the API side
    const currentBody = { ...current, country: current.countryCode };
    const isUnchanged = Object.entries(body).every(([key, value]) => (value ?? '') === (currentBody[key] ?? ''));
    if (isUnchanged) {
      Logger.println(`Nothing to update in ${formatOrganisation(organisation)}`);
      return;
    }

    const updated = await updateOrganisation({ id: organisation.id }, body)
      .then(sendToApi)
      .catch((error) => {
        throw organisationUpdateError(error, orgaLabel);
      });

    Logger.printSuccess(`Organisation ${formatOrganisation(updated)} updated`);
    const changes = getChanges(current, updated);
    const width = Math.max(0, ...changes.map(([label]) => label.length + 1)) + 2;
    for (const [label, before, after] of changes) {
      Logger.println(`  ${`${label}:`.padEnd(width)}${before} → ${after}`);
    }
  },
});

/**
 * Ask for the new value of a field in the interactive mode.
 * @param {string} label
 * @param {string | null | undefined} currentValue
 * @param {Object} [config]
 * @param {(value: string) => true | string} [config.validate]
 * @returns {Promise<string | undefined>} `undefined` to keep the field, an empty string to clear it
 */
async function promptField(label, currentValue, { validate = () => true } = {}) {
  const shown = isEmpty(currentValue) ? 'empty' : currentValue;
  const answer = (
    await promptText(`${label} (current: ${shown}):`, (value) => value.trim() === '' || validate(value.trim()))
  ).trim();
  if (answer === '') {
    return undefined;
  }
  return answer === CLEAR_KEYWORD ? '' : answer;
}

/**
 * @param {string | null | undefined} value - Value of the option, an empty string clears the field
 * @param {string | null} currentValue
 * @returns {string | null}
 */
function clearable(value, currentValue) {
  if (value == null) {
    return currentValue ?? null;
  }
  return value === '' ? null : value;
}

/**
 * List the fields that differ between two raw organisations, as printed values.
 * @param {any} before
 * @param {any} after
 * @returns {Array<[string, string, string]>} Label, value before, value after
 */
function getChanges(before, after) {
  /** @type {Array<[string, string, string]>} */
  const changes = [];
  for (const [key, label] of DIFF_FIELDS) {
    const beforeValue = formatField(before, key);
    const afterValue = formatField(after, key);
    if (beforeValue !== afterValue) {
      changes.push([label, beforeValue, afterValue]);
    }
  }
  return changes;
}

/**
 * @param {any} organisation - Raw organisation
 * @param {string} key
 * @returns {string}
 */
function formatField(organisation, key) {
  const value = organisation[key];
  if (isEmpty(value)) {
    return '-';
  }
  if (key === 'countryCode') {
    return formatCountry(value, organisation.country) ?? '-';
  }
  return key === 'VAT' ? formatVatNumber(value, organisation.vatState) : value;
}

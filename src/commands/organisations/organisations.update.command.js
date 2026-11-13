import { get as getOrganisation, update as updateOrganisation } from '@clevercloud/client/esm/api/v2/organisation.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { organisationUpdateError } from '../../lib/organisation-errors.js';
import {
  formatOrganisation,
  formatOrganisationLabel,
  formatVatNumber,
  isEmpty,
} from '../../lib/organisation-format.js';
import { Logger } from '../../logger.js';
import { resolveOrganisation } from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { orgaIdOrNameArg } from './organisations.args.js';

const CLEAR_HINT = 'An empty value clears it';

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
  ['country', 'Country'],
];

export const organisationsUpdateCommand = defineCommand({
  description: 'Update the details of an organisation',
  since: null,
  options: {
    name: defineOption({
      name: 'name',
      schema: z.string().optional(),
      description: 'Name of the organisation',
      placeholder: 'name',
    }),
    description: defineOption({
      name: 'description',
      schema: z.string().optional(),
      description: 'Description of the organisation',
      placeholder: 'description',
    }),
    billingName: defineOption({
      name: 'billing-name',
      schema: z.string().optional(),
      description: `Full name of the billing contact. ${CLEAR_HINT}`,
      placeholder: 'billing-name',
    }),
    billingEmail: defineOption({
      name: 'billing-email',
      schema: z.string().optional(),
      description: `Email address receiving the invoices. ${CLEAR_HINT}`,
      placeholder: 'billing-email',
    }),
    address: defineOption({
      name: 'address',
      schema: z.string().optional(),
      description: `Billing address. ${CLEAR_HINT}`,
      placeholder: 'address',
    }),
    city: defineOption({
      name: 'city',
      schema: z.string().optional(),
      description: `Billing city. ${CLEAR_HINT}`,
      placeholder: 'city',
    }),
    zipcode: defineOption({
      name: 'zipcode',
      schema: z.string().optional(),
      description: `Billing zipcode. ${CLEAR_HINT}`,
      placeholder: 'zipcode',
    }),
    country: defineOption({
      name: 'country',
      schema: z
        .string()
        .regex(/^([a-z]{2})?$/i, 'Use a two-letter ISO country code (for example FR)')
        .transform((value) => value.toUpperCase())
        .optional(),
      description: `Billing country, as a two-letter ISO code (for example FR). Required when the organisation already has a country. ${CLEAR_HINT}`,
      placeholder: 'country-code',
    }),
    company: defineOption({
      name: 'company',
      schema: z.string().optional(),
      description: `Company name, for a business. ${CLEAR_HINT}`,
      placeholder: 'company',
    }),
    vatNumber: defineOption({
      name: 'vat-number',
      schema: z.string().optional(),
      description: `VAT number of the company, requires a company. ${CLEAR_HINT}`,
      placeholder: 'vat-number',
    }),
  },
  args: [orgaIdOrNameArg],
  async handler(options, orgaIdOrName) {
    const { name, description, billingName, billingEmail, address, city, zipcode, country, company, vatNumber } =
      options;

    const values = [name, description, billingName, billingEmail, address, city, zipcode, country, company, vatNumber];
    if (values.every((value) => value == null)) {
      throw new Error('No option provided, nothing to update');
    }

    const organisation = await resolveOrganisation(orgaIdOrName);
    const orgaLabel = formatOrganisationLabel(organisation);
    const current = await getOrganisation({ id: organisation.id }).then(sendToApi);

    // The API returns the country as a name but only accepts a code, and erases a missing country:
    // the current country cannot be sent back, so the user has to give it again.
    if (!isEmpty(current.country) && country == null) {
      throw new Error(
        `Cannot update ${orgaLabel} without --country: the current country (${current.country}) is only readable as a name, pass --country <code> (for example FR) to keep or change it`,
      );
    }

    // The API erases every key missing from the body: send them all, built from the current state.
    const body = {
      name: name ?? current.name,
      description: description ?? current.description,
      address: clearable(address, current.address),
      city: clearable(city, current.city),
      zipcode: clearable(zipcode, current.zipcode),
      country: isEmpty(country) ? null : country,
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
  return key === 'VAT' ? formatVatNumber(value, organisation.vatState) : value;
}

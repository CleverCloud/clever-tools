import { get as getOrganisation } from '@clevercloud/client/esm/api/v2/organisation.js';
import { defineCommand } from '../../lib/define-command.js';
import { formatOrganisation, formatVatNumber, isEmpty } from '../../lib/organisation-format.js';
import { fetchMembers } from '../../lib/organisation-members.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { resolveOrganisation } from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { orgaIdOrNameArg } from './organisations.args.js';

export const organisationsGetCommand = defineCommand({
  description: 'Get the details of an organisation',
  since: null,
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [orgaIdOrNameArg],
  async handler(options, orgaIdOrName) {
    const { format } = options;

    const organisation = await resolveOrganisation(orgaIdOrName);
    const rawOrganisation = await getOrganisation({ id: organisation.id }).then(sendToApi);
    const members = organisation.isPersonal ? null : await fetchMembers(organisation.id, null);
    const details = toOrganisationDetails(rawOrganisation, organisation, members);

    switch (format) {
      case 'json': {
        Logger.printJson(details);
        break;
      }
      case 'human':
      default: {
        printOrganisationDetails(details);
      }
    }
  },
});

/**
 * @typedef {ReturnType<typeof toOrganisationDetails>} OrganisationDetails
 */

/**
 * Build the details of an organisation, as printed in json format, from the raw API organisation.
 * @param {any} rawOrganisation - Body of `GET /v2/organisations/{id}`
 * @param {import('../../models/organisation.js').OrganisationSummary} organisation - The resolved organisation
 * @param {Array<import('../../lib/organisation-members.js').OrganisationMember> | null} members - `null` when not
 *   available (personal space, refused member list)
 */
function toOrganisationDetails(rawOrganisation, organisation, members) {
  return {
    id: rawOrganisation.id,
    name: rawOrganisation.name,
    role: organisation.role,
    isPersonal: organisation.isPersonal,
    description: rawOrganisation.description ?? null,
    avatar: rawOrganisation.avatar ?? null,
    membersCount: members?.length ?? null,
    adminsCount: members?.filter((member) => member.role === 'ADMIN').length ?? null,
    billingName: rawOrganisation.customerFullName ?? null,
    company: rawOrganisation.company ?? null,
    vatNumber: rawOrganisation.VAT ?? null,
    vatState: rawOrganisation.vatState ?? null,
    billingEmail: rawOrganisation.billingEmail ?? null,
    address: rawOrganisation.address ?? null,
    city: rawOrganisation.city ?? null,
    zipcode: rawOrganisation.zipcode ?? null,
    country: rawOrganisation.country ?? null,
    canPay: rawOrganisation.canPay,
    isPremium: rawOrganisation.cleverEnterprise === true,
    emergencyNumber: rawOrganisation.emergencyNumber ?? null,
  };
}

/**
 * @param {OrganisationDetails} details
 */
function printOrganisationDetails(details) {
  const personal = details.isPersonal ? ' personal' : '';
  Logger.println(`${formatOrganisation(details)}${personal}`);

  /** @type {Array<[string, string | null]>} */
  const general = [
    ['Role', details.role],
    ['Description', details.description],
  ];
  if (!details.isPersonal) {
    general.push(['Members', formatMembersCount(details.membersCount, details.adminsCount)]);
  }
  printSection('General', general);

  /** @type {Array<[string, string | null]>} */
  const billing = [['Name', details.billingName]];
  if (!isEmpty(details.company)) {
    billing.push(['Company', details.company]);
  }
  if (!isEmpty(details.vatNumber)) {
    billing.push(['VAT number', formatVatNumber(details.vatNumber, details.vatState)]);
  }
  billing.push(
    ['Email', details.billingEmail],
    ['Address', details.address],
    ['City', details.city],
    ['Zipcode', details.zipcode],
    ['Country', details.country],
  );
  printSection('Billing', billing);

  printSection('Support', [
    ['Premium', details.isPremium ? 'yes' : 'no'],
    ['Emergency number', details.emergencyNumber],
  ]);

  if (details.canPay === false) {
    Logger.println();
    Logger.println(`${styleText('yellow', '⚠')} Billing details incomplete, payment impossible`);
  }
}

/**
 * Print a bold section title, then its `Label: value` lines, indented, every label padded to the longest one.
 * A null or empty value prints `-`.
 * @param {string} title
 * @param {Array<[string, string | null]>} lines
 */
function printSection(title, lines) {
  const width = Math.max(...lines.map(([label]) => label.length + 1)) + 2;
  Logger.println();
  Logger.println(styleText('bold', title));
  for (const [label, value] of lines) {
    Logger.println(`  ${`${label}:`.padEnd(width)}${isEmpty(value) ? '-' : value}`);
  }
}

/**
 * @param {number | null} membersCount
 * @param {number | null} adminsCount
 * @returns {string | null}
 */
function formatMembersCount(membersCount, adminsCount) {
  if (membersCount == null || adminsCount == null) {
    return null;
  }
  const members = `${membersCount} member${membersCount === 1 ? '' : 's'}`;
  const admins = `${adminsCount} admin${adminsCount === 1 ? '' : 's'}`;
  return `${members} (${admins})`;
}

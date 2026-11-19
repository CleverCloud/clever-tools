import { formatBorderedTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { listOrganisations } from '../../models/organisation.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const orgsListCommand = defineCommand({
  description: 'List your organisations',
  since: '5.5.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  async handler(options) {
    const { format } = options;

    const organisations = sortOrganisations(await listOrganisations());

    switch (format) {
      case 'json': {
        Logger.printJson(organisations);
        break;
      }
      case 'human':
      default: {
        if (organisations.length === 0) {
          Logger.println('🔎 No organisation found');
          return;
        }
        const rows = organisations.map((organisation) => [organisation.name, organisation.id, organisation.role]);
        Logger.println(formatBorderedTable([['NAME', 'ID', 'ROLE'], ...rows]));
      }
    }
  },
});

/**
 * Sort the organisations by name, case insensitive, the personal space first.
 * @param {Array<import('../../models/organisation.js').OrganisationSummary>} organisations
 * @returns {Array<import('../../models/organisation.js').OrganisationSummary>}
 */
function sortOrganisations(organisations) {
  return organisations.toSorted((a, b) => {
    if (a.isPersonal !== b.isPersonal) {
      return a.isPersonal ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

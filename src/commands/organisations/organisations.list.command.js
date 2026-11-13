import { defineCommand } from '../../lib/define-command.js';
import { formatOrganisation } from '../../lib/organisation-format.js';
import { Logger } from '../../logger.js';
import { listOrganisations } from '../../models/organisation.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const organisationsListCommand = defineCommand({
  description: 'List the organisations you are a member of, your personal space included',
  since: null,
  options: {
    format: humanJsonOutputFormatOption,
  },
  async handler(options) {
    const { format } = options;

    const organisations = await listOrganisations();

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
        const plural = organisations.length > 1 ? 's' : '';
        Logger.println(`🔎 Found ${organisations.length} organisation${plural}:`);
        Logger.println();
        for (const organisation of organisations) {
          const personal = organisation.isPersonal ? ' personal' : '';
          Logger.println(`• ${formatOrganisation(organisation)}${personal}`);
          Logger.println(`  Role: ${organisation.role}`);
        }
      }
    }
  },
});

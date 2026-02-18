import { config } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { formatProfileDetails, getProfileDetails } from '../../lib/profile.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const profileListCommand = defineCommand({
  description: 'List all configured profiles',
  since: '4.6.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  async handler(options) {
    if (config.profiles.length === 0) {
      throw new Error('No profile found. You are not logged in.');
    }

    const profilesDetails = await Promise.all(
      config.profiles.map(async (profile, index) => {
        return getProfileDetails({
          profile,
          isActive: index === 0,
        });
      }),
    );

    switch (options.format) {
      case 'json': {
        Logger.printJson(profilesDetails);
        break;
      }
      case 'human':
      default: {
        Logger.println(
          profilesDetails
            .map((details) => {
              return formatProfileDetails(details);
            })
            .join('\n\n'),
        );
      }
    }
  },
});

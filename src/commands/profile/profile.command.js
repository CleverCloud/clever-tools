import { config } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { formatProfileDetails, getProfileDetails } from '../../lib/profile.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const profileCommand = defineCommand({
  description: 'Display the profile of the current user',
  since: '0.10.1',
  options: {
    format: humanJsonOutputFormatOption,
  },
  async handler(options) {
    const [activeProfile] = config.profiles;
    if (activeProfile == null) {
      throw new Error(`No profile found, use ${styleText('red', 'clever login')} command`);
    }

    const details = await getProfileDetails({ profile: activeProfile, isActive: true });
    if (!details.isTokenValid) {
      throw new Error(`Your token is invalid or has expired, use ${styleText('red', 'clever login')} command`);
    }

    switch (options.format) {
      case 'json': {
        Logger.printJson(details);
        break;
      }
      case 'human':
      default: {
        Logger.println(formatProfileDetails(details));
      }
    }
  },
});

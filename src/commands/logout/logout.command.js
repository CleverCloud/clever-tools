import { z } from 'zod';
import { config, removeProfile } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { formatProfile } from '../../lib/profile.js';
import { Logger } from '../../logger.js';

export const logoutCommand = defineCommand({
  description: 'Logout from Clever Cloud',
  since: '1.0.0',
  options: {
    alias: defineOption({
      name: 'alias',
      aliases: ['a'],
      schema: z.string().optional(),
      description: 'Alias of the profile to log out',
      placeholder: 'alias',
    }),
  },
  async handler(options) {
    if (config.profiles.length === 0) {
      throw new Error('No profile found. You are not logged in.');
    }

    const [activeProfile] = config.profiles;
    const aliasToRemove = options.alias ?? activeProfile.alias;

    if (aliasToRemove === '$env') {
      throw new Error('Cannot logout from environment-based profile. Unset CLEVER_TOKEN and CLEVER_SECRET instead.');
    }

    const profileToRemove = config.profiles.find((p) => p.alias === aliasToRemove);
    if (profileToRemove == null) {
      throw new Error(`Profile "${aliasToRemove}" not found.`);
    }

    const newActiveProfile = await removeProfile(aliasToRemove);
    Logger.printSuccess(`Logged out of profile ${formatProfile(profileToRemove)}`);

    if (newActiveProfile != null && newActiveProfile.alias !== activeProfile.alias) {
      Logger.printSuccess(`Switched active profile to ${formatProfile(newActiveProfile)}`);
    }
  },
});

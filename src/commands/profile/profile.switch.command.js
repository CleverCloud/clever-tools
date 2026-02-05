import { z } from 'zod';
import { config, saveProfile } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { formatProfile } from '../../lib/profile.js';
import { selectAnswer } from '../../lib/prompts.js';
import { Logger } from '../../logger.js';

/** @typedef {import('../../config/config.js').Profile} Profile */

export const profileSwitchCommand = defineCommand({
  description: 'Switch to a different profile',
  since: 'unreleased',
  options: {
    alias: defineOption({
      name: 'alias',
      aliases: ['a'],
      schema: z.string().optional(),
      description: 'Alias of the profile to switch to',
      placeholder: 'alias',
    }),
  },
  async handler(options) {
    if (config.profiles.length === 0) {
      throw new Error('No profile found.');
    }

    if (config.profiles.length === 1) {
      throw new Error('Only one profile. Use clever login --alias <name> to add another.');
    }

    const [activeProfile] = config.profiles;
    if (activeProfile.alias === '$env') {
      throw new Error(
        'Cannot switch profiles while using environment-based authentication. Unset CLEVER_TOKEN and CLEVER_SECRET first.',
      );
    }

    const targetProfile = await resolveTargetProfile(config.profiles, options.alias);
    if (targetProfile.alias === activeProfile.alias) {
      Logger.printInfo(`Already on profile ${formatProfile(activeProfile)}`);
      return;
    }

    await saveProfile(targetProfile);
    Logger.printSuccess(`Switched to profile ${formatProfile(targetProfile)}`);
  },
});

/**
 * Resolve the target profile to switch to.
 * @param {Profile[]} profiles
 * @param {string | undefined} requestedAlias
 * @returns {Promise<Profile>}
 */
async function resolveTargetProfile(profiles, requestedAlias) {
  if (requestedAlias != null) {
    const targetProfile = profiles.find((p) => p.alias === requestedAlias);
    if (targetProfile == null) {
      const availableAliases = profiles.map((p) => p.alias).join(', ');
      throw new Error(`Profile "${requestedAlias}" not found. Available profiles: ${availableAliases}`);
    }
    return targetProfile;
  }

  if (profiles.length === 2) {
    return profiles[1];
  }

  const choices = profiles.map((profile) => ({
    name: formatProfile(profile),
    value: profile.alias,
  }));
  const selectedAlias = await selectAnswer('Select a profile:', choices);
  return profiles.find((profile) => profile.alias === selectedAlias);
}

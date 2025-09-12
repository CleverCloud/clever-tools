#!/usr/bin/env node
//
// Manage and switch between Clever Cloud user profiles.
//
// This script allows users to store multiple Clever Cloud authentication tokens
// and switch between different user accounts. It maintains a list of saved profiles
// and provides both interactive and command-line interfaces for profile switching.
//
// USAGE: switch-profile.js [userId]
//
// ARGUMENTS:
//   [userId]        User ID to switch to directly (optional, defaults to interactive mode)
//
// REQUIRED SYSTEM BINARIES:
//   clever          Clever Cloud CLI for fetching user information
//
// EXAMPLES:
//   switch-profile.js              # Interactive mode - shows profile list and prompts for selection
//   switch-profile.js user_12345   # Direct mode - switches to specific user ID

import { select } from '@inquirer/prompts';
import { execSync } from 'node:child_process';
import process from 'node:process';
import { styleText } from '../src/lib/style-text.js';
import { runCommand } from './lib/command.js';
import { readJson, writeJson } from './lib/fs.js';
import { TerminalTable } from './lib/terminal-table.js';

/**
 * @typedef {import('./lib/common.types.js').Profile} Profile
 * @typedef {import('./lib/common.types.js').StyleTextFormat} StyleTextFormat
 */

const CONFIG_DIR = `${process.env.HOME}/.config/clever-cloud`;
const CONFIG_PATH = `${CONFIG_DIR}/clever-tools.json`;
const PROFILES_PATH = `${CONFIG_DIR}/profiles.json`;
const USER_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

runCommand(async function () {
  // Read current tokens from clever-tools configuration
  const currentTokens = await readJson(CONFIG_PATH).then((rawTokens) => {
    return /** @type {{token: string, secret: string}} */ (rawTokens);
  });

  // Read existing profiles from storage
  const savedProfiles = await readJson(PROFILES_PATH)
    .catch(() => [])
    .then((rawProfiles) => /** @type {Array<Profile>} */ (rawProfiles));

  // Fetch current user info from Clever Cloud API
  /** @type {Profile|undefined} */
  let currentProfile;
  try {
    // TODO replace with direct curl
    const selfJson = execSync('clever curl -s https://api.clever-cloud.com/v2/self', { encoding: 'utf8' });
    const self = JSON.parse(selfJson);
    currentProfile = {
      name: self.name,
      email: self.email,
      id: self.id,
      ...currentTokens,
    };
  } catch (error) {
    console.error('Failed to fetch user info:', error.message);
  }

  // Update profiles list with current profile
  if (currentProfile != null) {
    const currentSavedProfile = savedProfiles.find(({ id }) => id === currentProfile.id);
    if (currentSavedProfile == null) {
      savedProfiles.push(currentProfile);
    } else {
      currentSavedProfile.name = currentProfile.name;
      currentSavedProfile.email = currentProfile.email;
      currentSavedProfile.token = currentProfile.token;
      currentSavedProfile.secret = currentProfile.secret;
      currentSavedProfile.expirationDate = currentProfile.expirationDate;
    }
  }

  // Mark current profile in the list
  for (const p of savedProfiles) {
    p.current = p.id === currentProfile?.id;
  }

  // Save updated profiles back to storage
  try {
    await writeJson(PROFILES_PATH, savedProfiles);
  } catch (error) {
    throw new Error(`Failed to save profiles: ${error.message}`);
  }

  // Filter profiles that can be switched to
  const availableProfiles = savedProfiles.filter(({ current }) => !current);

  if (availableProfiles.length === 0) {
    return console.log('No profiles to switch to :-(');
  }

  // Display all profiles in a table
  const rows = savedProfiles.map((profile) => {
    /** @type {StyleTextFormat} */
    const style = profile.current ? 'yellow' : 'grey';
    return [
      styleText(style, profile.name),
      styleText(style, profile.email),
      styleText(style, profile.id),
      styleText(style, profile.current ? 'Current profile' : ''),
    ];
  });

  /** @type {Array<[string, StyleTextFormat]>} */
  const columns = [
    ['NAME', 'none'],
    ['EMAIL', 'none'],
    ['ID', 'none'],
    ['', 'none'],
  ];

  const terminalTable = new TerminalTable(columns, rows);
  terminalTable.renderInit();

  const [userIdArg] = process.argv.slice(2);

  // Select profile to switch to (from CLI arg or interactive prompt)
  let newProfile;
  if (userIdArg != null) {
    if (!USER_ID_REGEX.test(userIdArg)) {
      return console.log('Invalid profile ID format');
    }
    newProfile = savedProfiles.find((profile) => profile.id === userIdArg);
  } else {
    const selectedProfileId = await select({
      message: 'Select a user account',
      choices: availableProfiles.map((profile) => ({
        name: profile.email,
        value: profile.id,
      })),
    }).catch(exitOnPromptError);
    newProfile = savedProfiles.find((profile) => profile.id === selectedProfileId);
  }
  if (newProfile == null) {
    return console.log('Invalid choice :-(');
  }

  const newTokens = {
    token: newProfile.token,
    secret: newProfile.secret,
  };

  try {
    await writeJson(CONFIG_PATH, newTokens);
    console.log(`Switched to profile: ${newProfile.email}`);
  } catch (error) {
    throw new Error(`Failed to save config: ${error.message}`);
  }
});

/**
 * Handles prompt cancellation errors by exiting the process gracefully.
 *
 * @param {Error} error - Error thrown by prompt cancellation
 * @throws {Error} Re-throws non-ExitPromptError errors
 */
function exitOnPromptError(error) {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    process.exit(1);
  }
  throw error;
}

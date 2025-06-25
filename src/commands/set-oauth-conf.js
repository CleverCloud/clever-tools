import { conf } from '../models/configuration.js';
import { confirm, promptInput, promptSecret } from '../lib/prompts.js';
import { writeFileSync } from 'node:fs';
import { Logger } from '../logger.js';
import colors from 'colors/safe.js';

export async function askConf () {
  const apiHost = await promptInput('API Host');
  const consoleTokenUrl = await promptInput('Console Token URL');
  const oauthConsumerKey = await promptSecret('OAuth Consumer Key');
  const oauthConsumerSecret = await promptSecret('OAuth Consumer Secret');

  const config = {
    API_HOST: apiHost,
    CONSOLE_TOKEN_URL: consoleTokenUrl,
    OAUTH_CONSUMER_KEY: oauthConsumerKey,
    OAUTH_CONSUMER_SECRET: oauthConsumerSecret,
  };

  try {
    writeFileSync(conf.THIRD_PARTY_ZONE_FILE, JSON.stringify(config, null, 2));
  }
  catch (error) {
    console.error('Error writing configuration file:', error);
  }

  Logger.printSuccess(`OAuth Configuration saved successfully, test it with ${colors.green('clever login')}`);
}

export async function clearConf () {
  const confirmation = await confirm('Are you sure you want to clear the OAuth configuration? This will remove all OAuth settings.');
  if (!confirmation) {
    throw new Error('OAuth Configuration clearing aborted');
  }

  try {
    writeFileSync(conf.THIRD_PARTY_ZONE_FILE, '{}');
    Logger.printSuccess('OAuth Configuration cleared successfully');
  }
  catch (error) {
    console.error('Error clearing configuration file:', error);
  }
}

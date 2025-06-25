import { conf } from '../models/configuration.js';
import { promptInput, promptSecret } from '../lib/prompts.js';
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

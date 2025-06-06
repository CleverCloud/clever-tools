import colors from 'colors/safe.js';
import * as User from '../models/user.js';

import { Logger } from '../logger.js';
import { promptEmail, promptPassword } from '../prompt.js';
import { sendToAuthBridge } from '../models/send-to-api.js';
import { writeOAuthConf } from '../models/configuration.js';
import { createApiToken } from '../clever-client/auth-bridge.js';

async function loginViaConsole () {
  const dateObject = new Date();
  dateObject.setFullYear(dateObject.getFullYear() + 1);
  const expirationDate = dateObject;

  const name = `Clever Tools - ${dateObject.getTime()}`;
  const email = await promptEmail('Enter your email:');
  const password = await promptPassword('Enter your password:');
  const mfaCode = await promptPassword('Enter your 2FA code (press Enter if none):');

  const tokenData = {
    email,
    password,
    mfaCode,
    name,
    expirationDate: expirationDate.toISOString(),
  };

  return createApiToken(tokenData).then(sendToAuthBridge).catch((error) => {
    const errorCode = error?.cause?.responseBody?.code;
    if (errorCode === 'invalid-credential') {
      throw new Error('Invalid credentials, check your password');
    }
    if (errorCode === 'invalid-mfa-code') {
      throw new Error('Invalid credentials, check your 2FA code');
    }
    throw error;
  });
}

export async function login (params) {
  const { token, secret } = params.options;
  const isLoginWithArgs = (token != null && secret != null);
  const isInteractiveLogin = (token == null && secret == null);

  if (isLoginWithArgs) {
    return writeOAuthConf({ token, secret });
  }

  if (isInteractiveLogin) {
    const oauthData = await loginViaConsole();
    await writeOAuthConf(oauthData);
    const { name, email } = await User.getCurrent();
    const formattedName = name || colors.red.bold('[unspecified name]');
    return Logger.println(`Login successful as ${formattedName} <${email}>`);
  }

  throw new Error('Both `--token` and `--secret` have to be defined');
}

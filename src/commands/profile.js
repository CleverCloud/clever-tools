import colors from 'colors/safe.js';
import openPage from 'open';
import { Logger } from '../logger.js';
import * as User from '../models/user.js';
import dedent from 'dedent';

export async function profile (params) {
  const { format } = params.options;

  const user = await User.getCurrent();
  const currentToken = await User.getCurrentToken();
  const tokenExpiration = new Date(currentToken.expirationDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    timeZone: 'UTC',
    timeZoneName: 'short',
  });

  const formattedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    creationDate: new Date(user.creationDate),
    tokenExpiration: new Date(currentToken.expirationDate).toISOString(),
    lang: user.lang,
    has2FA: (user.preferredMFA != null && user.preferredMFA !== 'NONE'),
  };

  switch (format) {
    case 'json': {
      Logger.printJson(formattedUser);
      break;
    }
    case 'human':
    default: {
      Logger.println(dedent`
        You're currently logged in as:
        User id           ${formattedUser.id}
        Name              ${formattedUser.name ?? colors.red.bold('[not specified]')}
        Email             ${formattedUser.email}
        Token expiration  ${tokenExpiration}
        Two factor auth   ${formattedUser.has2FA ? 'yes' : 'no'}
      `);
    }
  }
};

export async function openProfile () {
  const URL = 'https://console.clever-cloud.com/users/me/information';
  Logger.debug('Opening the profile page in your browser');
  await openPage(URL, { wait: false });
}

import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import * as User from '../models/user.js';

export async function profile (params) {
  const { format } = params.options;

  const user = await User.getCurrent();

  const formattedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    creationDate: new Date(user.creationDate),
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
      Logger.println('You\'re currently logged in as:');
      Logger.println(`User id          ${formattedUser.id}`);
      Logger.println(`Name             ${formattedUser.name ?? colors.red.bold('[not specified]')}`);
      Logger.println(`Email            ${formattedUser.email}`);
      Logger.println(`Two factor auth  ${formattedUser.has2FA ? 'yes' : 'no'}`);
    }
  }
};

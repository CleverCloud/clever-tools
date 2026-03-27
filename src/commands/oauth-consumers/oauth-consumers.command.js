import { defineCommand } from '../../lib/define-command.js';

export const oauthConsumersCommand = defineCommand({
  description: 'Manage OAuth consumers used with a Clever Cloud login',
  since: '4.8.0',
  options: {},
  args: [],
  handler: null,
});

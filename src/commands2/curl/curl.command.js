import { defineCommand } from '../../lib/define-command.js';

export const curlCommand = defineCommand({
  description: "Query Clever Cloud's API using Clever Tools credentials",
  since: '2.10.0',
  options: {},
  args: [],
  handler() {
    throw new Error('Not implemented');
  },
});

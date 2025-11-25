import { defineArgument } from '../../lib/define-argument.js';

export const databaseIdArg = defineArgument({
  name: 'database-id',
  description: 'Any database ID (format: addon_UUID, postgresql_UUID, mysql_UUID, ...)',
  parser: null,
  complete: null,
});

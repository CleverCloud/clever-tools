import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const databaseIdArg = defineArgument({
  schema: z.string(),
  description: 'Any database ID (format: addon_UUID, postgresql_UUID, mysql_UUID, ...)',
  placeholder: 'database-id|addon-id',
});

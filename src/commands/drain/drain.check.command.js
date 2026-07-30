import { CheckLogDrainCommand } from '@clevercloud/client/cc-api-commands/log-drain/check-log-drain-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { resolveDrainResource } from '../../models/drain.js';
import {
  addonIdOrRealIdOption,
  aliasOption,
  appIdOrNameOption,
  humanJsonOutputFormatOption,
} from '../global.options.js';
import { drainIdArg } from './drain.args.js';

export const drainCheckCommand = defineCommand({
  description: "Check that a drain's recipient is reachable and accepts deliveries",
  since: '4.11.0',
  options: {
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
    format: humanJsonOutputFormatOption,
  },
  args: [drainIdArg],
  async handler(options, drainId) {
    const { alias, appIdOrName, addonIdOrRealId, format } = options;
    const resource = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const probe = await clients.ccApi.send(new CheckLogDrainCommand({ ...resource, drainId }));
    switch (format) {
      case 'json': {
        Logger.printJson({ ok: probe.ok, message: probe.message });
        break;
      }
      case 'human':
      default: {
        const status = probe.ok ? styleText(['bold', 'green'], 'OK') : styleText(['bold', 'red'], 'FAILED');
        Logger.println(`Probe: ${status}`);
        Logger.println(probe.message);
      }
    }
  },
});

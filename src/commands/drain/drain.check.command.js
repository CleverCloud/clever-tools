import { checkDrain } from '../../clever-client/drains.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { resolveDrainResource } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';
import {
  addonIdOrRealIdOption,
  aliasOption,
  appIdOrNameOption,
  humanJsonOutputFormatOption,
} from '../global.options.js';
import { drainIdArg } from './drain.args.js';

export const drainCheckCommand = defineCommand({
  description: "Check that a drain's recipient is reachable and accepts deliveries",
  since: 'unreleased',
  options: {
    alias: aliasOption,
    appIdOrName: appIdOrNameOption,
    addonIdOrRealId: addonIdOrRealIdOption,
    format: humanJsonOutputFormatOption,
  },
  args: [drainIdArg],
  async handler(options, drainId) {
    const { alias, appIdOrName, addonIdOrRealId, format } = options;
    const { ownerId, resourceId } = await resolveDrainResource(alias, appIdOrName, addonIdOrRealId);

    const probe = await checkDrain({ ownerId, resourceId, drainId }).then(sendToApi);
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

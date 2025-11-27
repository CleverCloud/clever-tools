import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineFlag } from '../../lib/define-flag.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { listAvailableFlavors } from '../../models/application.js';
import { buildFlavor, flavor } from '../../parsers.js';
import { aliasFlag, appIdOrNameFlag } from '../global.flags.js';

function validateOptions(options) {
  let { flavor, 'min-flavor': minFlavor, 'max-flavor': maxFlavor } = options;
  let {
    instances,
    'min-instances': minInstances,
    'max-instances': maxInstances,
    'build-flavor': buildFlavor,
  } = options;

  if ([flavor, minFlavor, maxFlavor, instances, minInstances, maxInstances, buildFlavor].every((v) => v == null)) {
    throw new Error('You should provide at least 1 option');
  }

  if (flavor != null) {
    if (minFlavor != null || maxFlavor != null) {
      throw new Error("You can't use --flavor and --min-flavor or --max-flavor at the same time");
    }
    minFlavor = flavor;
    maxFlavor = flavor;
  }

  if (instances != null) {
    if (minInstances != null || maxInstances != null) {
      throw new Error("You can't use --instances and --min-instances or --max-instances at the same time");
    }
    minInstances = instances;
    maxInstances = instances;
  }

  if (minInstances != null && maxInstances != null && minInstances > maxInstances) {
    throw new Error("min-instances can't be greater than max-instances");
  }

  if (minFlavor != null && maxFlavor != null) {
    const minFlavorIndex = Application.listAvailableFlavors().indexOf(minFlavor);
    const maxFlavorIndex = Application.listAvailableFlavors().indexOf(maxFlavor);
    if (minFlavorIndex > maxFlavorIndex) {
      throw new Error("min-flavor can't be a greater flavor than max-flavor");
    }
  }

  return { minFlavor, maxFlavor, minInstances, maxInstances, buildFlavor };
}

export const scaleCommand = defineCommand({
  description: 'Change scalability of an application',
  flags: {
    flavor: defineFlag({
      name: 'flavor',
      schema: z.string().transform(flavor).optional(),
      description: 'The instance size of your application',
      placeholder: 'flavor',
      complete: listAvailableFlavors,
    }),
    'min-flavor': defineFlag({
      name: 'min-flavor',
      schema: z.string().transform(flavor).optional(),
      description: 'The minimum scale size of your application',
      placeholder: 'minflavor',
      complete: listAvailableFlavors,
    }),
    'max-flavor': defineFlag({
      name: 'max-flavor',
      schema: z.string().transform(flavor).optional(),
      description: 'The maximum instance size of your application',
      placeholder: 'maxflavor',
      complete: listAvailableFlavors,
    }),
    instances: defineFlag({
      name: 'instances',
      schema: z.coerce.number().int().positive().optional(),
      description: 'The number of parallel instances',
      placeholder: 'instances',
    }),
    'min-instances': defineFlag({
      name: 'min-instances',
      schema: z.coerce.number().int().positive().optional(),
      description: 'The minimum number of parallel instances',
      placeholder: 'mininstances',
    }),
    'max-instances': defineFlag({
      name: 'max-instances',
      schema: z.coerce.number().int().positive().optional(),
      description: 'The maximum number of parallel instances',
      placeholder: 'maxinstances',
    }),
    'build-flavor': defineFlag({
      name: 'build-flavor',
      schema: z.string().transform(buildFlavor).optional(),
      description: "The size of the build instance, or 'disabled' if you want to disable dedicated build instances",
      placeholder: 'buildflavor',
    }),
    alias: aliasFlag,
    app: appIdOrNameFlag,
  },
  args: [],
  async handler(flags) {
    const { alias, app: appIdOrName } = flags;
    const { minFlavor, maxFlavor, minInstances, maxInstances, buildFlavor } = validateOptions(flags);
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    await Application.setScalability(
      appId,
      ownerId,
      {
        minFlavor,
        maxFlavor,
        minInstances,
        maxInstances,
      },
      buildFlavor,
    );

    Logger.println('App rescaled successfully');
  },
});

import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import {
  buildFlavor as buildFlavorParser,
  flavor as flavorParser,
  instances as instancesParser,
} from '../../parsers.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

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

export const scaleCommand = {
  name: 'scale',
  description: 'Change scalability of an application',
  experimental: false,
  featureFlag: null,
  opts: {
    flavor: {
      name: 'flavor',
      description: 'The instance size of your application',
      type: 'option',
      metavar: 'flavor',
      aliases: null,
      default: null,
      required: null,
      parser: flavorParser,
      complete: 'cliparse.autocomplete.words(Application.listAvailableFlavors())',
    },
    'min-flavor': {
      name: 'min-flavor',
      description: 'The minimum scale size of your application',
      type: 'option',
      metavar: 'minflavor',
      aliases: null,
      default: null,
      required: null,
      parser: flavorParser,
      complete: 'cliparse.autocomplete.words(Application.listAvailableFlavors())',
    },
    'max-flavor': {
      name: 'max-flavor',
      description: 'The maximum instance size of your application',
      type: 'option',
      metavar: 'maxflavor',
      aliases: null,
      default: null,
      required: null,
      parser: flavorParser,
      complete: 'cliparse.autocomplete.words(Application.listAvailableFlavors())',
    },
    instances: {
      name: 'instances',
      description: 'The number of parallel instances',
      type: 'option',
      metavar: 'instances',
      aliases: null,
      default: null,
      required: null,
      parser: instancesParser,
      complete: null,
    },
    'min-instances': {
      name: 'min-instances',
      description: 'The minimum number of parallel instances',
      type: 'option',
      metavar: 'mininstances',
      aliases: null,
      default: null,
      required: null,
      parser: instancesParser,
      complete: null,
    },
    'max-instances': {
      name: 'max-instances',
      description: 'The maximum number of parallel instances',
      type: 'option',
      metavar: 'maxinstances',
      aliases: null,
      default: null,
      required: null,
      parser: instancesParser,
      complete: null,
    },
    'build-flavor': {
      name: 'build-flavor',
      description: "The size of the build instance, or 'disabled' if you want to disable dedicated build instances",
      type: 'option',
      metavar: 'buildflavor',
      aliases: null,
      default: null,
      required: null,
      parser: buildFlavorParser,
      complete: null,
    },
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName } = params.options;
    const { minFlavor, maxFlavor, minInstances, maxInstances, buildFlavor } = validateOptions(params.options);
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
};

import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Addon from '../../models/addon.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { addonProviderArg } from './addon.args.js';

export const addonProvidersShowCommand = defineCommand({
  description: 'Show information about an add-on provider',
  since: '0.2.3',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [addonProviderArg],
  async handler(options, providerName) {
    const { format } = options;

    const provider = await Addon.getProvider(providerName);
    const providerInfos = await Addon.getProviderInfos(providerName);

    const formattedPlans = [...provider.plans]
      .sort((a, b) => a.price - b.price)
      .map((plan) => {
        const formattedFeatures = plan.features
          .map((feature) => ({
            name: feature.name,
            value: feature.value,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const formattedPlan = {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          features: formattedFeatures,
        };

        if (providerInfos != null) {
          const planType = plan.features.find(({ name }) => name.toLowerCase() === 'type');
          if (planType != null && planType.value.toLowerCase() === 'dedicated') {
            const planVersions = Object.keys(providerInfos.dedicated);
            formattedPlan.versions = planVersions.map((version) => {
              return {
                version,
                isDefault: version === providerInfos.defaultDedicatedVersion,
                features: providerInfos.dedicated[version].features.map((feature) => ({
                  name: feature.name,
                  enabledByDefault: feature.enabled,
                })),
              };
            });
          }
        }

        return formattedPlan;
      });

    const formattedProvider = {
      id: provider.id,
      name: provider.name,
      shortDesc: provider.shortDesc,
      regions: provider.regions,
      plans: formattedPlans,
    };

    switch (format) {
      case 'json': {
        Logger.printJson(formattedProvider);
        break;
      }
      case 'human':
      default: {
        Logger.println(styleText('bold', formattedProvider.id));
        Logger.println(`${formattedProvider.name}: ${formattedProvider.shortDesc}`);
        Logger.println();
        Logger.println(`Available regions: ${formattedProvider.regions.join(', ')}`);
        Logger.println();
        Logger.println('Available plans');

        formattedProvider.plans.forEach((plan) => {
          Logger.println(`Plan ${styleText('bold', plan.slug)}`);
          plan.features.forEach(({ name, value }) => Logger.println(`  ${name}: ${value}`));

          if (plan.versions != null) {
            Logger.println(
              `  Available versions: ${plan.versions.map(({ version, isDefault }) => (isDefault ? `${version} (default)` : version)).join(', ')}`,
            );
            plan.versions.forEach(({ version, features }) => {
              Logger.println(`  Options for version ${version}:`);
              features.forEach(({ name, enabledByDefault }) => {
                Logger.println(`    ${name}: default=${enabledByDefault}`);
              });
            });
          }
        });
      }
    }
  },
});

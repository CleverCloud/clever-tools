import { defineCommand } from '../../lib/define-command.js';
import { k8sGetQuota, k8sListUsage } from '../../lib/k8s.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';

const BYTES_PER_GB = 1024 ** 3;
const UNIT_TO_BYTES = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: BYTES_PER_GB,
  TB: 1024 ** 4,
  PB: 1024 ** 5,
};

export const k8sQuotaCommand = defineCommand({
  description: 'Get the Kubernetes quota, usage and remaining of an organisation',
  since: 'unreleased',
  options: {
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format, org: orgIdOrName } = options;
    const [quota, usageItems] = await Promise.all([k8sGetQuota(orgIdOrName), k8sListUsage(orgIdOrName)]);

    const cpuQuota = quota.quotas?.find((i) => i.type === 'MillivCPUMaxLimit');
    const ramQuota = quota.quotas?.find((i) => i.type === 'RamMaxUsage');
    const usedMillicores = usageItems.reduce((sum, i) => sum + i.cpuMillicores, 0);
    const usedBytes = usageItems.reduce((sum, i) => sum + i.ramBytes, 0);

    switch (format) {
      case 'json': {
        const { quotas, ...quotaRest } = quota;
        Logger.printJson({
          quota: {
            ...quotaRest,
            vCPUMax: cpuQuota != null ? { maximum: cpuQuota.maximum, unit: 'mCPU' } : null,
            ramMax: ramQuota != null ? { maximum: ramQuota.information.number, unit: ramQuota.information.unit } : null,
          },
          usage: { cpuMillicores: usedMillicores, ramBytes: usedBytes },
          remaining: {
            cpuMillicores: cpuQuota != null ? cpuQuota.maximum - usedMillicores : null,
            ramBytes: ramQuota != null ? ramToBytes(ramQuota.information) - usedBytes : null,
          },
        });
        break;
      }
      case 'human':
      default: {
        const ramQuotaBytes = ramQuota != null ? ramToBytes(ramQuota.information) : null;
        console.table({
          'Max CPU': {
            Quota: cpuQuota != null ? `${cpuQuota.maximum / 1000} vCPU` : 'unlimited',
            Usage: `${usedMillicores / 1000} vCPU`,
            Remaining: cpuQuota != null ? `${(cpuQuota.maximum - usedMillicores) / 1000} vCPU` : 'unlimited',
          },
          'Max RAM': {
            Quota: ramQuota != null ? `${ramQuota.information.number} ${ramQuota.information.unit}` : 'unlimited',
            Usage: `${formatGb(usedBytes)} GB`,
            Remaining: ramQuotaBytes != null ? `${formatGb(ramQuotaBytes - usedBytes)} GB` : 'unlimited',
          },
        });
        break;
      }
    }
  },
});

function ramToBytes({ number, unit }) {
  return number * (UNIT_TO_BYTES[unit] ?? BYTES_PER_GB);
}

function formatGb(bytes) {
  return Math.round((bytes / BYTES_PER_GB) * 100) / 100;
}

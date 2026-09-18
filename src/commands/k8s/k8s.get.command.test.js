import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { stripVTControlCharacters } from 'node:util';

const getK8sCluster = mock.fn();
mock.module('../../lib/k8s.js', { namedExports: { getK8sCluster } });
const { k8sGetCommand } = await import('./k8s.get.command.js');

const cluster = {
  id: 'kubernetes-test',
  name: 'clever-tools-csi-bug',
  status: 'ACTIVE',
  version: '1.35',
  topologyConfig: { topology: 'ALL_IN_ONE', flavor: 'S', replicationFactor: 1 },
  features: { autoscalingEnabled: true, csi: false },
  tags: ['test', 'csi'],
  description: 'Persistent storage regression test',
  storageUsageBytes: 1024 ** 3,
};

async function captureOutput(t, k8sInfo, options = { format: 'human' }) {
  getK8sCluster.mock.mockImplementation(async () => k8sInfo);
  let output = '';
  const write = t.mock.method(process.stdout, 'write', (chunk) => {
    output += chunk;
    return true;
  });

  try {
    await k8sGetCommand.handler(options, cluster.id);
  } finally {
    write.mock.restore();
  }
  return stripVTControlCharacters(output);
}

const cases = [
  { name: 'CSI is false', properties: { features: { csi: false } }, expected: 'disabled' },
  { name: 'CSI is true', properties: { features: { csi: true } }, expected: 'enabled' },
  { name: 'CSI is absent', properties: { features: {} }, expected: 'disabled' },
  { name: 'CSI is null', properties: { features: { csi: null } }, expected: 'disabled' },
  { name: 'features are absent', properties: {}, expected: 'disabled' },
  { name: 'features are null', properties: { features: null }, expected: 'disabled' },
];

for (const { name, properties, expected } of cases) {
  test(`human output shows persistent storage ${expected} when ${name}`, async (t) => {
    const output = await captureOutput(t, { id: cluster.id, ...properties });
    assert.match(output, new RegExp(`Persistent storage\\s+│\\s+'${expected}'`));
  });
}

test('default output shows disabled persistent storage and preserves other cluster information', async (t) => {
  const output = await captureOutput(t, cluster, { org: { orga_id: 'orga-test' } });

  for (const [label, value] of Object.entries({
    Name: cluster.name,
    ID: cluster.id,
    Status: cluster.status,
    Version: cluster.version,
    Topology: 'ALL_IN_ONE (S, rf=1)',
    Autoscaling: 'enabled',
    'Persistent storage': 'disabled',
    Tags: 'test, csi',
    Description: cluster.description,
    Storage: '1 GB',
  })) {
    const row = output.split('\n').find((line) => line.includes(` ${label} `));
    assert.ok(row?.includes(`'${value}'`), `Expected ${label} to display ${value}`);
  }
  assert.ok(output.includes(`clever k8s get-kubeconfig ${cluster.id} --org "orga-test"`));
  assert.deepEqual(getK8sCluster.mock.calls.at(-1).arguments, [{ orga_id: 'orga-test' }, cluster.id]);
});

test('JSON output preserves the complete API response including CSI false', async (t) => {
  const output = await captureOutput(t, cluster, { format: 'json' });
  assert.equal(output, `${JSON.stringify(cluster, null, 2)}\n`);
  assert.deepEqual(JSON.parse(output), cluster);
});

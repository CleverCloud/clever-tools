import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { k8sCreateCommand } from '../src/commands/k8s/k8s.create.command.js';
import { k8sNodeGroupCreateCommand } from '../src/commands/k8s/k8s.nodegroups.create.command.js';
import { k8sNodeGroupUpdateCommand } from '../src/commands/k8s/k8s.nodegroups.update.command.js';
import { k8sUpdateCommand } from '../src/commands/k8s/k8s.update.command.js';
import { buildClusterFeaturesPatch, formatFeatureState, k8sCreate, processFeaturesError } from '../src/lib/k8s.js';

const clusterIdOrName = { addon_name: 'myKubeCluster' };

function apiError(status, message = 'Something went wrong') {
  return Object.assign(new Error(message), { response: { status } });
}

describe('buildClusterFeaturesPatch()', () => {
  it('updates each feature independently without touching the other autoscaler', () => {
    assert.deepEqual(buildClusterFeaturesPatch({ autoscaling: true }), { autoscalingEnabled: true });
    assert.deepEqual(buildClusterFeaturesPatch({ disableAutoscaling: true }), { autoscalingEnabled: false });
    assert.deepEqual(buildClusterFeaturesPatch({ nodeAutoprovisioning: true }), { nodeAutoprovisioning: true });
    assert.deepEqual(buildClusterFeaturesPatch({ disableNodeAutoprovisioning: true }), {
      nodeAutoprovisioning: false,
    });
  });

  it('mentions nothing when the update only carries metadata', () => {
    assert.deepEqual(buildClusterFeaturesPatch({ name: 'myKubeCluster' }), {});
  });

  it('does not interpret default false options as requests to disable features', () => {
    assert.deepEqual(
      buildClusterFeaturesPatch({
        autoscaling: false,
        disableAutoscaling: false,
        nodeAutoprovisioning: false,
        disableNodeAutoprovisioning: false,
      }),
      {},
    );
  });

  it('allows switching between autoscalers with an explicit disable', () => {
    assert.deepEqual(buildClusterFeaturesPatch({ disableAutoscaling: true, nodeAutoprovisioning: true }), {
      autoscalingEnabled: false,
      nodeAutoprovisioning: true,
    });
    assert.deepEqual(buildClusterFeaturesPatch({ autoscaling: true, disableNodeAutoprovisioning: true }), {
      autoscalingEnabled: true,
      nodeAutoprovisioning: false,
    });
  });

  it('rejects contradictory feature toggles and simultaneous autoscalers', () => {
    const incompatibleOptions = [
      { autoscaling: true, disableAutoscaling: true },
      { nodeAutoprovisioning: true, disableNodeAutoprovisioning: true },
      { autoscaling: true, nodeAutoprovisioning: true },
    ];

    incompatibleOptions.forEach((options) => {
      assert.throws(() => buildClusterFeaturesPatch(options), /mutually exclusive/);
    });
  });
});

describe('k8sCreate()', () => {
  it('rejects simultaneous autoscalers before resolving the owner or calling the API', async () => {
    await assert.rejects(
      k8sCreate('myKubeCluster', undefined, { autoscaling: true, nodeAutoprovisioning: true }),
      /--autoscaling and --node-autoprovisioning are mutually exclusive/,
    );
  });
});

describe('formatFeatureState()', () => {
  it('reports an installed feature as enabled', () => {
    assert.equal(formatFeatureState(true, 'ACTIVE'), 'enabled');
  });

  it('reports a reconciling cluster with the state it currently has, still moving', () => {
    assert.equal(formatFeatureState(false, 'RECONCILING'), 'disabled (cluster reconciling)');
  });

  it('never claims a cluster is enabling while it is really removing the feature', () => {
    assert.equal(formatFeatureState(true, 'RECONCILING'), 'enabled (cluster reconciling)');
  });

  it('reports a settled cluster without the feature as disabled', () => {
    assert.equal(formatFeatureState(false, 'ACTIVE'), 'disabled');
  });

  it('never reads a reported value other than true as enabled', () => {
    assert.equal(formatFeatureState(undefined, 'ACTIVE'), 'disabled');
    assert.equal(formatFeatureState(null, 'ACTIVE'), 'disabled');
  });
});

describe('processFeaturesError()', () => {
  it('points to the cluster status when the features are locked', () => {
    const error = processFeaturesError(apiError(412), clusterIdOrName, {});

    assert.match(error.message, /features are locked/);
    assert.match(error.message, /clever k8s get/);
  });

  it('names the foreign Karpenter when enabling is refused', () => {
    const error = processFeaturesError(apiError(409), clusterIdOrName, { disabling: false });

    assert.match(error.message, /already runs a Karpenter/);
  });

  it('asks to delete the leftover resources when disabling is refused', () => {
    const error = processFeaturesError(apiError(409), clusterIdOrName, { disabling: true });

    assert.match(error.message, /still carries Karpenter resources/);
    assert.match(error.message, /NodePools, NodeOverlays and CleverNodeClasses/);
  });

  it('explains the exclusion with the node group autoscaler', () => {
    const error = processFeaturesError(apiError(400), clusterIdOrName, {});

    assert.match(error.message, /can't run alongside the node group autoscaler/);
    assert.match(error.message, /clever k8s update myKubeCluster --disable-autoscaling/);
  });

  it('leaves any other failure untouched', () => {
    const error = apiError(500, 'Internal server error');

    assert.equal(processFeaturesError(error, clusterIdOrName, {}), error);
  });

  it('keeps the API error as the cause, the only place its message survives', () => {
    const statuses = [400, 409, 412];

    statuses.forEach((status) => {
      const apiFailure = apiError(status, 'Cluster name already in use');
      const error = processFeaturesError(apiFailure, clusterIdOrName, {});

      assert.equal(error.cause, apiFailure, `status ${status} dropped the cause`);
    });
  });
});

describe('k8s command options', () => {
  it('exposes the node auto-provisioning toggles', () => {
    assert.equal(k8sCreateCommand.options.nodeAutoprovisioning.name, 'node-autoprovisioning');
    assert.equal(k8sUpdateCommand.options.nodeAutoprovisioning.name, 'node-autoprovisioning');
    assert.equal(k8sUpdateCommand.options.disableNodeAutoprovisioning.name, 'disable-node-autoprovisioning');
  });

  it('keeps "autoscaling" in the help text, that is the word users look for', () => {
    assert.match(k8sCreateCommand.options.nodeAutoprovisioning.description, /autoscaling/);
    assert.match(k8sUpdateCommand.options.nodeAutoprovisioning.description, /autoscaling/);
    assert.match(k8sUpdateCommand.options.disableNodeAutoprovisioning.description, /autoscaling/);
  });

  it('preserves the existing cluster and node group autoscaling options', () => {
    assert.equal(k8sCreateCommand.options.autoscaling.name, 'autoscaling');
    assert.equal(k8sUpdateCommand.options.autoscaling.name, 'autoscaling');
    assert.equal(k8sUpdateCommand.options.disableAutoscaling.name, 'disable-autoscaling');
    assert.equal(k8sNodeGroupCreateCommand.options.autoscaling.name, 'autoscaling');
    assert.equal(k8sNodeGroupUpdateCommand.options.autoscaling.name, 'autoscaling');
    assert.equal(k8sNodeGroupUpdateCommand.options.disableAutoscaling.name, 'disable-autoscaling');
    assert.equal(k8sNodeGroupCreateCommand.options.min.name, 'min');
    assert.equal(k8sNodeGroupCreateCommand.options.max.name, 'max');
    assert.equal(k8sNodeGroupUpdateCommand.options.min.name, 'min');
    assert.equal(k8sNodeGroupUpdateCommand.options.max.name, 'max');
  });
});

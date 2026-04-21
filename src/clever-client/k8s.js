// TODO: Move this to the Clever Cloud JS Client

/**
 * POST /v4/kubernetes/organisations/{ownerId}/clusters
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {Object} body
 */
export function createK8sCluster(params, body) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters`,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    // no queryParams
    body,
  });
}

/**
 * DELETE /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 */
export function deleteK8sCluster(params) {
  return Promise.resolve({
    method: 'delete',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * GET /v4/kubernetes/organisations/{ownerId}/clusters
 * @param {Object} params
 * @param {String} params.ownerId
 */
export function listK8sClusters(params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * GET /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 */
export function getK8sAddon(params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * GET /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}/kubeconfig.yaml
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 */
export function getK8sConfig(params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}/kubeconfig.yaml`,
    // headers: { Accept: 'application/x-yaml' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/kubernetes/organisations/ownerId}/clusters/{clusterId}/csi/ceph
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 */
export function addK8sPersistentStorage(params) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}/csi/ceph`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * PATCH /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}/node-groups/{nodeGroupId}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 * @param {String} params.nodeGroupId
 * @param {Object} body
 */
export function updateK8sNodeGroup(params, body) {
  return Promise.resolve({
    method: 'PATCH',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}/node-groups/${params.nodeGroupId}`,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    // no queryParams
    body,
  });
}

/**
 * DELETE /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}/node-groups/{nodeGroupId}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 * @param {String} params.nodeGroupId
 */
export function deleteK8sNodeGroup(params) {
  return Promise.resolve({
    method: 'delete',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}/node-groups/${params.nodeGroupId}`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}/node-groups
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 * @param {Object} body
 */
export function createK8sNodeGroup(params, body) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}/node-groups`,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    // no queryParams
    body,
  });
}

/**
 * GET /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}/node-groups
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 */
export function listK8sNodeGroups(params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}/node-groups`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * GET /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}/node-groups/{nodeGroupId}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 * @param {String} params.nodeGroupId
 */
export function getK8sNodeGroup(params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}/node-groups/${params.nodeGroupId}`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * GET /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}/deployment-events
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 * @param {Object} [queryParams]
 * @param {Number} [queryParams.limit]
 */
export function listK8sDeploymentEvents(params, queryParams = {}) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}/deployment-events`,
    headers: { Accept: 'application/json' },
    queryParams,
    // no body
  });
}

/**
 * GET /v4/kubernetes-product
 */
export function getK8sProduct() {
  return Promise.resolve({
    method: 'get',
    url: `/v4/kubernetes-product`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * GET /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}/version/check
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 */
export function getK8sVersionCheck(params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}/version/check`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/kubernetes/organisations/{ownerId}/clusters/{clusterId}/version/update
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.clusterId
 * @param {Object} body
 * @param {String} body.targetVersion
 */
export function updateK8sVersion(params, body) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/kubernetes/organisations/${params.ownerId}/clusters/${params.clusterId}/version/update`,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    // no queryParams
    body,
  });
}

/**
 * GET /v4/kubernetes/organisations/{ownerId}/quota
 * @param {Object} params
 * @param {String} params.ownerId
 */
export function getK8sQuota(params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/kubernetes/organisations/${params.ownerId}/quota`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * GET /v4/kubernetes/organisations/{ownerId}/usage
 * @param {Object} params
 * @param {String} params.ownerId
 */
export function listK8sUsage(params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/kubernetes/organisations/${params.ownerId}/usage`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

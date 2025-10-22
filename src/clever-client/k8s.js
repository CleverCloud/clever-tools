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

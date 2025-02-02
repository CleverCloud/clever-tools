export function createFunction (params, body) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/functions/organisations/${params.ownerId}/functions`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  });
}

export function getFunctions (params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/functions/organisations/${params.ownerId}/functions`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export function getFunction (params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/functions/organisations/${params.ownerId}/functions/${params.functionId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export function updateFunction (params, body) {
  return Promise.resolve({
    method: 'put',
    url: `/v4/functions/organisations/${params.ownerId}/functions/${params.functionId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  });
}

export function deleteFunction (params) {
  return Promise.resolve({
    method: 'delete',
    url: `/v4/functions/organisations/${params.ownerId}/functions/${params.functionId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export function createDeployment (params, body) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/functions/organisations/${params.ownerId}/functions/${params.functionId}/deployments`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  });
}

export function getDeployments (params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/functions/organisations/${params.ownerId}/functions/${params.functionId}/deployments`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export function getDeployment (params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/functions/organisations/${params.ownerId}/functions/${params.functionId}/deployments/${params.deploymentId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export function updateDeployment (params, body) {
  return Promise.resolve({
    method: 'put',
    url: `/v4/functions/organisations/${params.ownerId}/functions/${params.functionId}/deployments/${params.deploymentId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  });
}

export function deleteDeployment (params) {
  return Promise.resolve({
    method: 'delete',
    url: `/v4/functions/organisations/${params.ownerId}/functions/${params.functionId}/deployments/${params.deploymentId}`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export function triggerDeployment (params) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/functions/organisations/${params.ownerId}/functions/${params.functionId}/deployments/${params.deploymentId}/trigger`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

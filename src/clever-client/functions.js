import fs from 'node:fs';

const JSON_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export function listFunctions({ ownerId }) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/functions/organisations/${ownerId}/functions`,
    headers: JSON_HEADERS,
  });
}

export function createFunction({ ownerId }, body) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/functions/organisations/${ownerId}/functions`,
    headers: JSON_HEADERS,
    body,
  });
}

export function deleteFunction({ ownerId, functionId }) {
  return Promise.resolve({
    method: 'delete',
    url: `/v4/functions/organisations/${ownerId}/functions/${functionId}`,
    headers: JSON_HEADERS,
  });
}

export function listDeployments({ ownerId, functionId }) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/functions/organisations/${ownerId}/functions/${functionId}/deployments`,
    headers: JSON_HEADERS,
  });
}

export function createDeployment({ ownerId, functionId }, body) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/functions/organisations/${ownerId}/functions/${functionId}/deployments`,
    headers: JSON_HEADERS,
    body,
  });
}

export function getDeployment({ ownerId, functionId, deploymentId }) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/functions/organisations/${ownerId}/functions/${functionId}/deployments/${deploymentId}`,
    headers: JSON_HEADERS,
  });
}

export function deleteDeployment({ ownerId, functionId, deploymentId }) {
  return Promise.resolve({
    method: 'delete',
    url: `/v4/functions/organisations/${ownerId}/functions/${functionId}/deployments/${deploymentId}`,
    headers: JSON_HEADERS,
  });
}

export function triggerDeployment({ ownerId, functionId, deploymentId }) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/functions/organisations/${ownerId}/functions/${functionId}/deployments/${deploymentId}/trigger`,
    headers: JSON_HEADERS,
  });
}

/**
 * Upload function source code to the presigned upload URL.
 * @param {string} uploadUrl - Pre-signed URL returned by createDeployment
 * @param {string} filePath - Path to the source file to upload
 */
export async function uploadFunctionFile(uploadUrl, filePath) {
  const fileSize = fs.statSync(filePath).size;
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/wasm',
      'Content-Length': String(fileSize),
    },
    body: fs.readFileSync(filePath),
  });
  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}: ${await response.text()}`);
  }
}

// TODO: Move this to the Clever Cloud JS Client

/**
 * GET /v4/drains/organisations/{ownerId}/applications/{applicationId}/drains?status={status}&executionStatus={executionStatus}&executionStatusNotIn={executionStatusNotIn}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.applicationId
 * @param {String} params.status
 * @param {String} params.executionStatus
 * @param {String} params.executionStatusNotIn
 */
export function getDrains(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/drains/organisations/${params.ownerId}/applications/${params.applicationId}/drains`,
    headers: { Accept: 'application/json' },
    queryParams: {
      status: params.status,
      executionStatus: params.executionStatus,
      executionStatusNotIn: params.executionStatusNotIn,
    },
    // no body
  });
}

/**
 * POST /v4/drains/organisations/{ownerId}/applications/{applicationId}/drains
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.applicationId
 * @param {Object} params.body
 */
export function createDrain(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/drains/organisations/${params.ownerId}/applications/${params.applicationId}/drains`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: params.body,
  });
}

/**
 * DELETE /v4/drains/organisations/{ownerId}/applications/{applicationId}/drains/{drainId}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.applicationId
 * @param {String} params.drainId
 */
export function deleteDrain(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'delete',
    url: `/v4/drains/organisations/${params.ownerId}/applications/${params.applicationId}/drains/${params.drainId}`,
    headers: { Accept: 'application/json' },
    // no body
  });
}

/**
 * GET /v4/drains/organisations/{ownerId}/applications/{applicationId}/drains/{drainId}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.applicationId
 * @param {String} params.drainId
 */
export function getDrain(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/drains/organisations/${params.ownerId}/applications/${params.applicationId}/drains/${params.drainId}`,
    headers: { Accept: 'application/json' },
    // no body
  });
}

/**
 * PUT /v4/drains/organisations/{ownerId}/applications/{applicationId}/drains/{drainId}/disable
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.applicationId
 * @param {String} params.drainId
 */
export function disableDrain(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'PUT',
    url: `/v4/drains/organisations/${params.ownerId}/applications/${params.applicationId}/drains/${params.drainId}/disable`,
    headers: { Accept: 'application/json' },
    // no body
  });
}

/**
 * PUT /v4/drains/organisations/{ownerId}/applications/{applicationId}/drains/{drainId}/enable
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.applicationId
 * @param {String} params.drainId
 */
export function enableDrain(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'PUT',
    url: `/v4/drains/organisations/${params.ownerId}/applications/${params.applicationId}/drains/${params.drainId}/enable`,
    headers: { Accept: 'application/json' },
    // no body
  });
}

/**
 * PATCH /v4/drains/organisations/{ownerId}/applications/{applicationId}/drains/{drainId}/reset-cursor
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.applicationId
 * @param {String} params.drainId
 */
export function resetDrainCursor(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'PATCH',
    url: `/v4/drains/organisations/${params.ownerId}/applications/${params.applicationId}/drains/${params.drainId}/reset-cursor`,
    headers: { Accept: 'application/json' },
    // no body
  });
}

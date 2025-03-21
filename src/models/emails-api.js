
/**
* GET /self/emails
*/
export function getEmailAddresses () {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: '/v2/self/emails',
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
* DELETE /self/emails/{email}
* @param {Object} params
* @param {String} params.email
*/
export function removeEmailAddress (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'delete',
    url: `/v2/self/emails/${params.email}`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
* PUT /self/emails/{email}
* @param {Object} params
* @param {String} params.email
* @param {Object} body
*/
export function addEmailAddress (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'put',
    url: `/v2/self/emails/${params.email}`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    // no query params
    body,
  });
}

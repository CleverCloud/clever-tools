// TODO: Move this to the Clever Cloud JS Client

/**
 * GET /v4/billing/organisations/{ownerId}/invoices
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.limit
 * @param {String} params.since
 * @param {String} params.until
 */
export function listInvoices (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/billing/organisations/${params.ownerId}/invoices`,
    headers: { Accept: 'application/json' },
    queryParams: {
      limit: params.limit,
      since: params.since,
      until: params.until,
    },
    // no body
  });
}

/**
 * GET /v4/billing/organisations/{ownerId}/invoices/{invoiceId}{format}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.invoiceId
 * @param {String} params.format
 */
export function getInvoice (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/billing/organisations/${params.ownerId}/invoices/${params.invoiceId}${params.format}`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * @import { OneOrMany, MockRequest } from './mock-api.types.js';
 */

/**
 * Creates a normalized key for identifying and matching API requests.
 * This key is used internally to map requests to their corresponding mocks and call logs.
 *
 * The key combines the HTTP method (lowercased) and the normalized pathname,
 * ensuring consistent matching regardless of query parameters or path formatting.
 *
 * @param {MockRequest} request - The request object containing method and path
 * @returns {string} A normalized key in the format "method-pathname"
 *
 * const key1 = createRequestKey({ method: 'GET', path: '/api/users' });
 * // Returns: "get-/api/users"
 *
 * const key2 = createRequestKey({ method: 'POST', path: '/api/users?source=test' });
 * // Returns: "post-/api/users" (query params are ignored in the key)
 *
 * const key3 = createRequestKey({ method: 'get', path: 'api/users/' });
 * // Returns: "get-/api/users" (method lowercased, path normalized)
 * ```
 */
export function createRequestKey(request) {
  return [request.method.toLowerCase(), normalizePath(request.path).pathname].join('-');
}

/**
 * Normalizes a URL path and extracts query parameters.
 *
 * This function takes a potentially malformed path string and returns a normalized
 * pathname along with parsed query parameters. It handles various edge cases like
 * missing leading slashes and properly parses query strings.
 *
 * @param {string} path - The URL path to normalize (may include query parameters)
 * @returns {{pathname: string, queryParams: Record<string, OneOrMany<string>>}}
 *   Object containing the normalized pathname and parsed query parameters
 *
 * const result1 = normalizePath('/api/users?limit=10&sort=name');
 * // Returns: {
 * //   pathname: '/api/users',
 * //   queryParams: { limit: '10', sort: 'name' }
 * // }
 *
 * const result2 = normalizePath('api/users?tags=js&tags=node');
 * // Returns: {
 * //   pathname: '/api/users',
 * //   queryParams: { tags: ['js', 'node'] }
 * // }
 *
 * const result3 = normalizePath('/api/users/');
 * // Returns: {
 * //   pathname: '/api/users/',
 * //   queryParams: {}
 * // }
 * ```
 */
export function normalizePath(path) {
  const p = path.startsWith('/') ? path.substring(1) : path;
  const url = new URL('http://h/' + p);
  return {
    pathname: url.pathname,
    queryParams: decodeQueryParams(url),
  };
}

/**
 * Decodes query parameters from a URL object into a structured format.
 *
 * This function handles multiple values for the same parameter by converting
 * them into arrays. Single values remain as strings, while multiple values
 * become arrays of strings.
 *
 * @param {URL} url - The URL object to extract query parameters from
 * @returns {Record<string, OneOrMany<string>>}
 *   Object mapping parameter names to their values (string or array of strings)
 *
 * const url1 = new URL('http://example.com/api?limit=10&sort=name');
 * const params1 = decodeQueryParams(url1);
 * // Returns: { limit: '10', sort: 'name' }
 *
 * const url2 = new URL('http://example.com/api?tags=js&tags=node&tags=api');
 * const params2 = decodeQueryParams(url2);
 * // Returns: { tags: ['js', 'node', 'api'] }
 *
 * const url3 = new URL('http://example.com/api?single=value&multi=a&multi=b');
 * const params3 = decodeQueryParams(url3);
 * // Returns: { single: 'value', multi: ['a', 'b'] }
 *
 * const url4 = new URL('http://example.com/api');
 * const params4 = decodeQueryParams(url4);
 * // Returns: {}
 * ```
 */
export function decodeQueryParams(url) {
  /** @type {Record<string, OneOrMany<string>>} */
  const result = {};
  Array.from(url.searchParams.entries()).forEach(([k, v]) => {
    if (Object.hasOwn(result, k)) {
      if (Array.isArray(result[k])) {
        result[k] = [...result[k], v];
      } else {
        result[k] = [result[k], v];
      }
    } else {
      result[k] = v;
    }
  });

  return result;
}

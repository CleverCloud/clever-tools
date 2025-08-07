import { Resolver } from 'node:dns/promises';

export class DnsResolver {
  constructor() {
    this._resolver = new Resolver();
  }

  /**
   * Resolves A records for the given hostname.
   *
   * @async
   * @param {string} hostname - The hostname to resolve A records for.
   * @returns {Promise<string[]>} A promise that resolves to an array of IP addresses, or an empty array if not found or an error occurs.
   */
  resolveA(hostname) {
    return this._resolver.resolve4(hostname).catch((error) => {
      switch (error.code) {
        case 'ENOTFOUND':
        case 'ENODATA':
          return [];
      }
      throw new Error(`Could not resolve DNS for ${hostname}. Caused by: ${error.message}`);
    });
  }

  /**
   * Resolves CNAME records for the given hostname.
   *
   * @async
   * @param {string} hostname - The hostname to resolve CNAME records for.
   * @returns {Promise<string|null>} A promise that resolves to the CNAME record if found, or null if not found or an error occurs.
   */
  resolveCname(hostname) {
    return this._resolver.resolveCname(hostname).catch((error) => {
      switch (error.code) {
        case 'ENOTFOUND':
        case 'ENODATA':
          return null;
      }
      throw new Error(`Could not resolve DNS for ${hostname}. Caused by: ${error.message}`);
    });
  }
}

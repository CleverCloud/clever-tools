/**
 * @import { ResolveDnsResult } from '../../../../esm/utils/diag-domain-config.types.js'
 */
import { expect } from 'chai';
import { diagDomainConfig } from '../../../../esm/utils/diag-domain-config.js';

const HOSTNAME_EXAMPLE = 'example.com';
const HOSTNAME_TESTONLY = 'app-f6ed4d4f-9668-4a03-a6fd-b297c15fc825.cleverapps.io';

const A_RECORDS = ['50.100.150.200', '50.100.150.201', '50.100.150.202'];
const A_RECORDS_WITH_ONE_MISSING = ['50.100.150.201', '50.100.150.202'];
const A_RECORDS_WITH_ONE_UNKNOWN = ['50.100.150.210', '50.100.150.201', '50.100.150.202'];
const A_RECORDS_WITH_ALL_UNKNOWN = ['50.100.150.210', '50.100.150.211', '50.100.150.212'];

const CNAME_RECORD = 'cname.example.com.';
const ALTERNATIVE_CNAME_RECORD = 'example.net.';

describe('diag-domain-config#diagDomainConfig()', () => {
  const loadBalancerDnsConfig = {
    aRecords: A_RECORDS,
    cnameRecord: CNAME_RECORD,
  };
  describe('Apex host', () => {
    const domainInfo = {
      hostname: HOSTNAME_EXAMPLE,
      pathPrefix: '/',
      isWildcard: false,
      isApex: true,
    };

    it('All A records valid', () => {
      /** @type {ResolveDnsResult} */
      const resolveDnsResult = { aRecords: A_RECORDS, cnameRecords: [] };

      const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

      expect(domainDiagResults).to.deep.equal({
        hostname: domainInfo.hostname,
        pathPrefix: domainInfo.pathPrefix,
        isApex: domainInfo.isApex,
        isWildcard: domainInfo.isWildcard,
        diagSummary: 'valid',
        diagDetails: [
          {
            code: 'valid-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.200' },
          },
          {
            code: 'valid-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.201' },
          },
          {
            code: 'valid-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.202' },
          },
        ],
      });
    });

    it('1 A record unknown', () => {
      /** @type {ResolveDnsResult} */
      const resolveDnsResult = {
        aRecords: A_RECORDS_WITH_ONE_UNKNOWN,
        cnameRecords: [],
      };

      const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

      expect(domainDiagResults).to.deep.equal({
        hostname: domainInfo.hostname,
        pathPrefix: domainInfo.pathPrefix,
        isApex: domainInfo.isApex,
        isWildcard: domainInfo.isWildcard,
        diagSummary: 'invalid',
        diagDetails: [
          {
            code: 'unknown-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.210' },
          },
          {
            code: 'valid-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.201' },
          },
          {
            code: 'valid-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.202' },
          },
          {
            code: 'missing-a',
            record: { source: 'expected', type: 'A', value: '50.100.150.200' },
          },
        ],
      });
    });

    it('All A records unknown', () => {
      /** @type {ResolveDnsResult} */
      const resolveDnsResult = {
        aRecords: A_RECORDS_WITH_ALL_UNKNOWN,
        cnameRecords: [],
      };

      const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

      expect(domainDiagResults).to.deep.equal({
        hostname: domainInfo.hostname,
        pathPrefix: domainInfo.pathPrefix,
        isApex: domainInfo.isApex,
        isWildcard: domainInfo.isWildcard,
        diagSummary: 'invalid',
        diagDetails: [
          {
            code: 'unknown-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.210' },
          },
          {
            code: 'unknown-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.211' },
          },
          {
            code: 'unknown-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.212' },
          },
          {
            code: 'missing-a',
            record: { source: 'expected', type: 'A', value: '50.100.150.200' },
          },
          {
            code: 'missing-a',
            record: { source: 'expected', type: 'A', value: '50.100.150.201' },
          },
          {
            code: 'missing-a',
            record: { source: 'expected', type: 'A', value: '50.100.150.202' },
          },
        ],
      });
    });

    it('1 A record missing', () => {
      /** @type {ResolveDnsResult} */
      const resolveDnsResult = {
        aRecords: A_RECORDS_WITH_ONE_MISSING,
        cnameRecords: [],
      };

      const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

      expect(domainDiagResults).to.deep.equal({
        hostname: domainInfo.hostname,
        pathPrefix: domainInfo.pathPrefix,
        isApex: domainInfo.isApex,
        isWildcard: domainInfo.isWildcard,
        diagSummary: 'incomplete',
        diagDetails: [
          {
            code: 'valid-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.201' },
          },
          {
            code: 'valid-a',
            record: { source: 'resolved', type: 'A', value: '50.100.150.202' },
          },
          {
            code: 'missing-a',
            record: { source: 'expected', type: 'A', value: '50.100.150.200' },
          },
        ],
      });
    });

    it('All A records missing', () => {
      /** @type {ResolveDnsResult} */
      const resolveDnsResult = { aRecords: [], cnameRecords: [] };

      const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

      expect(domainDiagResults).to.deep.equal({
        hostname: domainInfo.hostname,
        pathPrefix: domainInfo.pathPrefix,
        isApex: domainInfo.isApex,
        isWildcard: domainInfo.isWildcard,
        diagSummary: 'no-config',
        diagDetails: [
          {
            code: 'missing-a',
            record: { source: 'expected', type: 'A', value: '50.100.150.200' },
          },
          {
            code: 'missing-a',
            record: { source: 'expected', type: 'A', value: '50.100.150.201' },
          },
          {
            code: 'missing-a',
            record: { source: 'expected', type: 'A', value: '50.100.150.202' },
          },
        ],
      });
    });
  });

  describe('Host with subdomain', () => {
    const domainInfo = {
      hostname: 'sub.example.com',
      pathPrefix: '/',
      isWildcard: false,
      isApex: false,
    };

    describe('With CNAME', () => {
      it('All A records valid', () => {
        /** @type {ResolveDnsResult} */
        const resolveDnsResult = {
          aRecords: A_RECORDS,
          cnameRecords: [CNAME_RECORD],
        };

        const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

        expect(domainDiagResults).to.deep.equal({
          hostname: domainInfo.hostname,
          pathPrefix: domainInfo.pathPrefix,
          isApex: domainInfo.isApex,
          isWildcard: domainInfo.isWildcard,
          diagSummary: 'valid',
          diagDetails: [
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.200',
              },
            },
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.201',
              },
            },
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.202',
              },
            },
          ],
        });
      });

      it('1 A record unknown', () => {
        /** @type {ResolveDnsResult} */
        const resolveDnsResult = {
          aRecords: A_RECORDS_WITH_ONE_UNKNOWN,
          cnameRecords: [ALTERNATIVE_CNAME_RECORD],
        };

        const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

        expect(domainDiagResults).to.deep.equal({
          hostname: domainInfo.hostname,
          pathPrefix: domainInfo.pathPrefix,
          isApex: domainInfo.isApex,
          isWildcard: domainInfo.isWildcard,
          diagSummary: 'invalid',
          diagDetails: [
            {
              code: 'unknown-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.210',
              },
            },
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.201',
              },
            },
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.202',
              },
            },
            {
              code: 'missing-a',
              record: {
                source: 'expected',
                type: 'A',
                value: '50.100.150.200',
              },
            },
            {
              code: 'missing-cname',
              record: {
                source: 'expected',
                type: 'CNAME',
                value: 'cname.example.com.',
              },
            },
            {
              code: 'unknown-cname',
              record: {
                source: 'resolved',
                type: 'CNAME',
                value: 'example.net.',
              },
            },
          ],
        });
      });

      it('All A records unknown', () => {
        /** @type {ResolveDnsResult} */
        const resolveDnsResult = {
          aRecords: A_RECORDS_WITH_ALL_UNKNOWN,
          cnameRecords: [ALTERNATIVE_CNAME_RECORD],
        };

        const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

        expect(domainDiagResults).to.deep.equal({
          hostname: domainInfo.hostname,
          pathPrefix: domainInfo.pathPrefix,
          isApex: domainInfo.isApex,
          isWildcard: domainInfo.isWildcard,
          diagSummary: 'invalid',
          diagDetails: [
            {
              code: 'unknown-a',
              record: { source: 'resolved', type: 'A', value: '50.100.150.210' },
            },
            {
              code: 'unknown-a',
              record: { source: 'resolved', type: 'A', value: '50.100.150.211' },
            },
            {
              code: 'unknown-a',
              record: { source: 'resolved', type: 'A', value: '50.100.150.212' },
            },
            {
              code: 'missing-a',
              record: { source: 'expected', type: 'A', value: '50.100.150.200' },
            },
            {
              code: 'missing-a',
              record: { source: 'expected', type: 'A', value: '50.100.150.201' },
            },
            {
              code: 'missing-a',
              record: { source: 'expected', type: 'A', value: '50.100.150.202' },
            },
            {
              code: 'missing-cname',
              record: {
                source: 'expected',
                type: 'CNAME',
                value: 'cname.example.com.',
              },
            },
            {
              code: 'unknown-cname',
              record: {
                source: 'resolved',
                type: 'CNAME',
                value: 'example.net.',
              },
            },
          ],
        });
      });

      it('1 A record missing', () => {
        /** @type {ResolveDnsResult} */
        const resolveDnsResult = {
          aRecords: A_RECORDS_WITH_ONE_MISSING,
          cnameRecords: [ALTERNATIVE_CNAME_RECORD],
        };

        const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

        expect(domainDiagResults).to.deep.equal({
          hostname: domainInfo.hostname,
          pathPrefix: domainInfo.pathPrefix,
          isApex: domainInfo.isApex,
          isWildcard: domainInfo.isWildcard,
          diagSummary: 'incomplete',
          diagDetails: [
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.201',
              },
            },
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.202',
              },
            },
            {
              code: 'missing-a',
              record: {
                source: 'expected',
                type: 'A',
                value: '50.100.150.200',
              },
            },
            {
              code: 'suggested-cname',
              record: {
                source: 'expected',
                type: 'CNAME',
                value: 'cname.example.com.',
              },
            },
            {
              code: 'unknown-cname',
              record: {
                source: 'resolved',
                type: 'CNAME',
                value: 'example.net.',
              },
            },
          ],
        });
      });

      it('All A records missing', () => {
        /** @type {ResolveDnsResult} */
        const resolveDnsResult = {
          aRecords: [],
          cnameRecords: [ALTERNATIVE_CNAME_RECORD],
        };

        const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

        expect(domainDiagResults).to.deep.equal({
          hostname: domainInfo.hostname,
          pathPrefix: domainInfo.pathPrefix,
          isApex: domainInfo.isApex,
          isWildcard: domainInfo.isWildcard,
          diagSummary: 'invalid',
          diagDetails: [
            {
              code: 'missing-cname',
              record: {
                source: 'expected',
                type: 'CNAME',
                value: 'cname.example.com.',
              },
            },
            {
              code: 'unknown-cname',
              record: {
                source: 'resolved',
                type: 'CNAME',
                value: 'example.net.',
              },
            },
          ],
        });
      });
    });

    describe('Without CNAME', () => {
      it('All A Records valid', () => {
        /** @type {ResolveDnsResult} */
        const resolveDnsResult = {
          aRecords: A_RECORDS,
          cnameRecords: [],
        };

        const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

        expect(domainDiagResults).to.deep.equal({
          hostname: domainInfo.hostname,
          pathPrefix: domainInfo.pathPrefix,
          isApex: domainInfo.isApex,
          isWildcard: domainInfo.isWildcard,
          diagSummary: 'valid',
          diagDetails: [
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.200',
              },
            },
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.201',
              },
            },
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.202',
              },
            },
            {
              code: 'suggested-cname',
              record: {
                source: 'expected',
                type: 'CNAME',
                value: 'cname.example.com.',
              },
            },
          ],
        });
      });

      it('1 A record unknown', () => {
        /** @type {ResolveDnsResult} */
        const resolveDnsResult = {
          aRecords: A_RECORDS_WITH_ONE_UNKNOWN,
          cnameRecords: [],
        };

        const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

        expect(domainDiagResults).to.deep.equal({
          hostname: domainInfo.hostname,
          pathPrefix: domainInfo.pathPrefix,
          isApex: domainInfo.isApex,
          isWildcard: domainInfo.isWildcard,
          diagSummary: 'invalid',
          diagDetails: [
            {
              code: 'unknown-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.210',
              },
            },
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.201',
              },
            },
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.202',
              },
            },
            {
              code: 'missing-a',
              record: {
                source: 'expected',
                type: 'A',
                value: '50.100.150.200',
              },
            },
            {
              code: 'missing-cname',
              record: {
                source: 'expected',
                type: 'CNAME',
                value: 'cname.example.com.',
              },
            },
          ],
        });
      });

      it('All A records unknown', () => {
        /** @type {ResolveDnsResult} */
        const resolveDnsResult = {
          aRecords: A_RECORDS_WITH_ALL_UNKNOWN,
          cnameRecords: [],
        };

        const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

        expect(domainDiagResults).to.deep.equal({
          hostname: domainInfo.hostname,
          pathPrefix: domainInfo.pathPrefix,
          isApex: domainInfo.isApex,
          isWildcard: domainInfo.isWildcard,
          diagSummary: 'invalid',
          diagDetails: [
            {
              code: 'unknown-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.210',
              },
            },
            {
              code: 'unknown-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.211',
              },
            },
            {
              code: 'unknown-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.212',
              },
            },
            {
              code: 'missing-a',
              record: {
                source: 'expected',
                type: 'A',
                value: '50.100.150.200',
              },
            },
            {
              code: 'missing-a',
              record: {
                source: 'expected',
                type: 'A',
                value: '50.100.150.201',
              },
            },
            {
              code: 'missing-a',
              record: {
                source: 'expected',
                type: 'A',
                value: '50.100.150.202',
              },
            },
            {
              code: 'missing-cname',
              record: {
                source: 'expected',
                type: 'CNAME',
                value: 'cname.example.com.',
              },
            },
          ],
        });
      });

      it('1 A record missing', () => {
        /** @type {ResolveDnsResult} */
        const resolveDnsResult = {
          aRecords: A_RECORDS_WITH_ONE_MISSING,
          cnameRecords: [],
        };

        const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

        expect(domainDiagResults).to.deep.equal({
          hostname: domainInfo.hostname,
          pathPrefix: domainInfo.pathPrefix,
          isApex: domainInfo.isApex,
          isWildcard: domainInfo.isWildcard,
          diagSummary: 'incomplete',
          diagDetails: [
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.201',
              },
            },
            {
              code: 'valid-a',
              record: {
                source: 'resolved',
                type: 'A',
                value: '50.100.150.202',
              },
            },
            {
              code: 'missing-a',
              record: {
                source: 'expected',
                type: 'A',
                value: '50.100.150.200',
              },
            },
            {
              code: 'suggested-cname',
              record: {
                source: 'expected',
                type: 'CNAME',
                value: 'cname.example.com.',
              },
            },
          ],
        });
      });

      it('All A records missing', () => {
        /** @type {ResolveDnsResult} */
        const resolveDnsResult = {
          aRecords: [],
          cnameRecords: [],
        };

        const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

        expect(domainDiagResults).to.deep.equal({
          hostname: domainInfo.hostname,
          pathPrefix: domainInfo.pathPrefix,
          isApex: domainInfo.isApex,
          isWildcard: domainInfo.isWildcard,
          diagSummary: 'no-config',
          diagDetails: [
            {
              code: 'missing-cname',
              record: {
                source: 'expected',
                type: 'CNAME',
                value: 'cname.example.com.',
              },
            },
          ],
        });
      });
    });

    it('Test-only host', () => {
      const domainInfo = {
        hostname: HOSTNAME_TESTONLY,
        pathPrefix: '/',
        isWildcard: false,
        isApex: false,
      };
      /** @type {ResolveDnsResult} */
      const resolveDnsResult = null;
      /** @type {null} */
      const loadBalancerDnsConfig = null;

      const domainDiagResults = diagDomainConfig(domainInfo, resolveDnsResult, loadBalancerDnsConfig);

      expect(domainDiagResults).to.deep.equal({
        hostname: domainInfo.hostname,
        pathPrefix: domainInfo.pathPrefix,
        isApex: domainInfo.isApex,
        isWildcard: domainInfo.isWildcard,
        diagSummary: 'managed',
        diagDetails: [],
      });
    });
  });
});

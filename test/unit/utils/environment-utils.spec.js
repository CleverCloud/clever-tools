import { expect } from 'chai';
import {
  ERROR_TYPES,
  parseRaw,
  parseRawJson,
  toJson,
  toNameEqualsValueString,
  toNameValueObject,
  validateName,
} from '../../../src/utils/environment-utils.js';

describe('environment-utils', () => {
  describe('validateName()', () => {
    it('OK (classic bash/linux)', () => {
      expect(validateName('FOOBAR')).to.equal(true);
      expect(validateName('FOO123')).to.equal(true);
      expect(validateName('FOO_BAR')).to.equal(true);
    });

    it('OK (clever cloud specials)', () => {
      expect(validateName('foobar')).to.equal(true);
      expect(validateName('123BAR')).to.equal(true);
      expect(validateName('FOO-BAR')).to.equal(true);
      expect(validateName('FOO.BAR')).to.equal(true);
    });

    it('NOT OK', () => {
      expect(validateName(' FOOBAR')).to.equal(false);
      expect(validateName('FOOBAR ')).to.equal(false);
      expect(validateName('FOO\nBAR')).to.equal(false);
      expect(validateName('FOO@BAR')).to.equal(false);
      expect(validateName('FOO)BAR')).to.equal(false);
      expect(validateName('FOO=BAR')).to.equal(false);
    });
  });

  describe('parseRaw()', () => {
    describe('OK', () => {
      it('simple var', () => {
        const rawInput = 'NAME_A=AAA';
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [{ name: 'NAME_A', value: `AAA` }],
          errors: [],
        });
      });

      it('multiple vars', () => {
        const rawInput = ['NAME_A=AAA', 'NAME_B=BBBB', 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: 'AAA' },
            { name: 'NAME_B', value: 'BBBB' },
            { name: 'NAME_C', value: 'CCCCC' },
          ],
          errors: [],
        });
      });

      it('warn java info', () => {
        const rawInput = ['NAME.A=AAA', 'NAME_B=BBBB', 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_B', value: 'BBBB' },
            { name: 'NAME_C', value: 'CCCCC' },
            { name: 'NAME.A', value: 'AAA' },
          ],
          errors: [
            {
              type: ERROR_TYPES.JAVA_INFO,
              name: 'NAME.A',
              pos: { line: 1, column: 0 },
            },
          ],
        });
      });

      it('accept empty values', () => {
        const rawInput = ['NAME_A=AAA', 'NAME_B=', 'NAME_C='].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: 'AAA' },
            { name: 'NAME_B', value: '' },
            { name: 'NAME_C', value: '' },
          ],
          errors: [],
        });
      });

      // We don't consider these as 2 values
      it('accept space in values', () => {
        const rawInput = ['NAME_A=AAA', 'NAME_B=BBBB BBBB', 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: 'AAA' },
            { name: 'NAME_B', value: 'BBBB BBBB' },
            { name: 'NAME_C', value: 'CCCCC' },
          ],
          errors: [],
        });
      });

      it('accept simple quotes in values', () => {
        const rawInput = ['NAME_A=AAA', `NAME_B=BBBB'BBBB`, 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: 'AAA' },
            { name: 'NAME_B', value: `BBBB'BBBB` },
            { name: 'NAME_C', value: 'CCCCC' },
          ],
          errors: [],
        });
      });

      it('accept double quotes in values', () => {
        const rawInput = ['NAME_A=AAA', `NAME_B=BBBB"BBBB`, 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: 'AAA' },
            { name: 'NAME_B', value: `BBBB"BBBB` },
            { name: 'NAME_C', value: 'CCCCC' },
          ],
          errors: [],
        });
      });

      // We consider = as part of the value
      it('accept = in values', () => {
        const rawInput = ['NAME_A=AAA', 'NAME_B=BBBB OTHER=BBBB', 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: 'AAA' },
            { name: 'NAME_B', value: 'BBBB OTHER=BBBB' },
            { name: 'NAME_C', value: 'CCCCC' },
          ],
          errors: [],
        });
      });

      it('ignore lines starting with comments', () => {
        const rawInput = ['NAME_A=AAA', '#NAME_B=BBBB', 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: 'AAA' },
            { name: 'NAME_C', value: 'CCCCC' },
          ],
          errors: [],
        });
      });

      it('ignore empty lines', () => {
        const rawInput = ['', 'NAME_A=AAA', '', 'NAME_B=BBBB', 'NAME_C=CCCCC', ''].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: 'AAA' },
            { name: 'NAME_B', value: 'BBBB' },
            { name: 'NAME_C', value: 'CCCCC' },
          ],
          errors: [],
        });
      });

      it('line breaks must be quoted (simple)', () => {
        const rawInput = [`NAME_A='A\na\nA'`, `NAME_B=BBBB`].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `A\na\nA` },
            { name: 'NAME_B', value: 'BBBB' },
          ],
          errors: [],
        });
      });

      it('line breaks must be quoted (double)', () => {
        const rawInput = [`NAME_A="A\na\nA"`, `NAME_B=BBBB`].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `A\na\nA` },
            { name: 'NAME_B', value: 'BBBB' },
          ],
          errors: [],
        });
      });

      it('simple quotes must be escaped in simple quotes', () => {
        const rawInput = [`NAME_A='AAA'`, `NAME_B='BBBB \\' BBBB'`, `NAME_C='CCCCC \\'CCCCC\\' CCCCC'`].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `AAA` },
            { name: 'NAME_B', value: `BBBB ' BBBB` },
            { name: 'NAME_C', value: `CCCCC 'CCCCC' CCCCC` },
          ],
          errors: [],
        });
      });

      it('double quotes must be escaped in double quotes', () => {
        const rawInput = [`NAME_A="AAA"`, `NAME_B="BBBB \\" BBBB"`, `NAME_C="CCCCC \\"CCCCC\\" CCCCC"`].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `AAA` },
            { name: 'NAME_B', value: `BBBB " BBBB` },
            { name: 'NAME_C', value: `CCCCC "CCCCC" CCCCC` },
          ],
          errors: [],
        });
      });

      it('understand multiple escaping', () => {
        // \" => "
        // \\\" => \"
        // \\\\\\" => \\"
        // \\\\\\\\" => \\\"
        // ...
        const rawInput = [
          // AAA \\\" AAA
          `NAME_A="AAA \\\\\\" AAA"`,
          // BBBB \\\\\"BBBB\\\\\" BBBB
          `NAME_B="BBBB \\\\\\\\\\"BBBB\\\\\\\\\\" BBBB"`,
          // CCCCC \\\\\\\"CCCCC\\\\\\\" CCCCC
          `NAME_C="CCCCC \\\\\\\\\\\\\\"CCCCC\\\\\\\\\\\\\\" CCCCC"`,
        ].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            // AAA \" AAA
            { name: 'NAME_A', value: `AAA \\" AAA` },
            // BBBB \\"BBBB\\" BBBB
            { name: 'NAME_B', value: `BBBB \\\\"BBBB\\\\" BBBB` },
            // CCCCC \\\"CCCCC\\\" CCCCC
            { name: 'NAME_C', value: `CCCCC \\\\\\"CCCCC\\\\\\" CCCCC` },
          ],
          errors: [],
        });
      });

      it('understand quoted slash+n as 2 different characters', () => {
        const rawInput = [
          'NAME_A="AAA\nAAA"',
          // BBBB\nBBBB
          `NAME_B="BBBB\\nBBBB"`,
        ].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            // AAA
            // AAA
            { name: 'NAME_A', value: `AAA\nAAA` },
            // BBBB\nBBBB
            { name: 'NAME_B', value: `BBBB\\nBBBB` },
          ],
          errors: [],
        });
      });

      it('sort vars by name', () => {
        const rawInput = ['NAME_C="CCCCC"', 'NAME_B="BBBB"', 'NAME_D="DDDDDD"', 'NAME_A="AAA"'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `AAA` },
            { name: 'NAME_B', value: `BBBB` },
            { name: 'NAME_C', value: `CCCCC` },
            { name: 'NAME_D', value: `DDDDDD` },
          ],
          errors: [],
        });
      });
    });

    describe('return errors', () => {
      it('invalid variable name', () => {
        const rawInput = ['NAME_A=AAA', 'NAME@BBBB=BBBB', 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: 'AAA' },
            { name: 'NAME_C', value: 'CCCCC' },
          ],
          errors: [
            {
              type: ERROR_TYPES.INVALID_NAME,
              name: 'NAME@BBBB',
              pos: { line: 2, column: 0 },
            },
          ],
        });
      });

      it('invalid variable name (strict mode) digit first char', () => {
        const rawInput = ['NAME_A=AAA', '0NAME_BBBB=BBBB', 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput, { mode: 'strict' })).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `AAA` },
            { name: 'NAME_C', value: `CCCCC` },
          ],
          errors: [
            {
              type: ERROR_TYPES.INVALID_NAME_STRICT,
              name: '0NAME_BBBB',
              pos: { line: 2, column: 0 },
            },
          ],
        });
      });

      it('invalid variable name (strict mode) dash', () => {
        const rawInput = ['NAME_A=AAA', 'NAME-BBBB=BBBB', 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput, { mode: 'strict' })).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `AAA` },
            { name: 'NAME_C', value: `CCCCC` },
          ],
          errors: [
            {
              type: ERROR_TYPES.INVALID_NAME_STRICT,
              name: 'NAME-BBBB',
              pos: { line: 2, column: 0 },
            },
          ],
        });
      });

      it('invalid variable name (strict mode) dot', () => {
        const rawInput = ['NAME_A=AAA', 'NAME.BBBB=BBBB', 'NAME_C=CCCCC'].join('\n');
        expect(parseRaw(rawInput, { mode: 'strict' })).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `AAA` },
            { name: 'NAME_C', value: `CCCCC` },
          ],
          errors: [
            {
              type: ERROR_TYPES.INVALID_NAME_STRICT,
              name: 'NAME.BBBB',
              pos: { line: 2, column: 0 },
            },
          ],
        });
      });

      it('duplicated variable names', () => {
        const rawInput = ['NAME_A=AAA', 'NAME_A=aaa'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [{ name: 'NAME_A', value: 'AAA' }],
          errors: [
            {
              type: ERROR_TYPES.DUPLICATED_NAME,
              name: 'NAME_A',
              pos: { line: 2, column: 0 },
            },
          ],
        });
      });

      it('line without =', () => {
        const rawInput = ['NAME_A=A', 'AA', 'NAME_B=BBBB'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: 'A' },
            { name: 'NAME_B', value: 'BBBB' },
          ],
          errors: [
            {
              type: ERROR_TYPES.INVALID_LINE,
              pos: { line: 2, column: 0 },
            },
          ],
        });
      });

      it('simple quoted value with text after last quote', () => {
        const rawInput = [`NAME_A='AAA' bad text`, 'NAME_B=BBBB'].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [{ name: 'NAME_B', value: 'BBBB' }],
          errors: [
            {
              type: ERROR_TYPES.INVALID_VALUE,
              name: 'NAME_A',
              pos: { line: 1, column: 12 },
            },
          ],
        });
      });

      it('no simple quote at the end', () => {
        const rawInput = [`NAME_A='AAA'`, `NAME_B='BBBB BBBB'`, `NAME_C='CCCCC CCCCC CCCCC`].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `AAA` },
            { name: 'NAME_B', value: `BBBB BBBB` },
          ],
          errors: [
            {
              type: ERROR_TYPES.INVALID_VALUE,
              name: 'NAME_C',
              pos: { line: 3, column: 25 },
            },
          ],
        });
      });

      it('no double quote at the end', () => {
        const rawInput = [`NAME_A="AAA"`, `NAME_B="BBBB BBBB"`, `NAME_C="CCCCC CCCCC CCCCC`].join('\n');
        expect(parseRaw(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `AAA` },
            { name: 'NAME_B', value: `BBBB BBBB` },
          ],
          errors: [
            {
              type: ERROR_TYPES.INVALID_VALUE,
              name: 'NAME_C',
              pos: { line: 3, column: 25 },
            },
          ],
        });
      });
    });
  });

  describe('parseRawJson()', () => {
    describe('OK', () => {
      it('simple var', () => {
        const rawInput = '[{"name":"NAME_A","value":"AAA"}]';
        expect(parseRawJson(rawInput)).to.deep.equal({
          variables: [{ name: 'NAME_A', value: `AAA` }],
          errors: [],
        });
      });

      it('multiple simple var', () => {
        const rawInput = '[{"name":"NAME_A","value":"AAA"}, {"name":"NAME_B","value":"BBB"}]';
        expect(parseRawJson(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_A', value: `AAA` },
            { name: 'NAME_B', value: `BBB` },
          ],
          errors: [],
        });
      });

      it('warn java info', () => {
        const rawInput = '[{"name":"NAME.A","value":"AAA"}, {"name":"NAME_B","value":"BBB"}]';
        expect(parseRawJson(rawInput)).to.deep.equal({
          variables: [
            { name: 'NAME_B', value: `BBB` },
            { name: 'NAME.A', value: `AAA` },
          ],
          errors: [
            {
              type: ERROR_TYPES.JAVA_INFO,
              name: 'NAME.A',
            },
          ],
        });
      });
    });

    describe('return errors', () => {
      it('duplicated name', () => {
        const rawInput = '[{"name":"NAME_A","value":"AAA"}, {"name":"NAME_A","value":"AAAAAA"}]';
        expect(parseRawJson(rawInput)).to.deep.equal({
          variables: [{ name: 'NAME_A', value: `AAA` }],
          errors: [{ type: ERROR_TYPES.DUPLICATED_NAME, name: 'NAME_A' }],
        });
      });

      it('invalid name', () => {
        const rawInput = '[{"name":"NAME_A","value":"AAA"}, {"name":"NAME@BBBB","value":"AAA"}]';
        expect(parseRawJson(rawInput)).to.deep.equal({
          variables: [{ name: 'NAME_A', value: `AAA` }],
          errors: [{ type: ERROR_TYPES.INVALID_NAME, name: 'NAME@BBBB' }],
        });
      });

      it('invalid name (strict mode) digit first char', () => {
        const rawInput = '[{"name":"NAME_A","value":"AAA"}, {"name":"0NAME_A","value":"AAA"}]';
        expect(parseRawJson(rawInput, { mode: 'strict' })).to.deep.equal({
          variables: [{ name: 'NAME_A', value: `AAA` }],
          errors: [{ type: ERROR_TYPES.INVALID_NAME_STRICT, name: '0NAME_A' }],
        });
      });

      it('invalid name (strict mode) dash', () => {
        const rawInput = '[{"name":"NAME_A","value":"AAA"}, {"name":"-NAME_A","value":"AAA"}]';
        expect(parseRawJson(rawInput, { mode: 'strict' })).to.deep.equal({
          variables: [{ name: 'NAME_A', value: `AAA` }],
          errors: [{ type: ERROR_TYPES.INVALID_NAME_STRICT, name: '-NAME_A' }],
        });
      });

      it('invalid name (strict mode) dot', () => {
        const rawInput = '[{"name":"NAME_A","value":"AAA"}, {"name":".NAME_A","value":"AAA"}]';
        expect(parseRawJson(rawInput, { mode: 'strict' })).to.deep.equal({
          variables: [{ name: 'NAME_A', value: `AAA` }],
          errors: [{ type: ERROR_TYPES.INVALID_NAME_STRICT, name: '.NAME_A' }],
        });
      });

      it('invalid JSON format', () => {
        const rawInput = '{"name":"NAME_A","value":"AAA"}';
        expect(parseRawJson(rawInput)).to.deep.equal({
          variables: [],
          errors: [{ type: ERROR_TYPES.INVALID_JSON_FORMAT }],
        });
      });

      it('Wrong JSON (comma at end of JSON)', () => {
        const rawInput = '[{"name":"NAME_A","value":"AAA"}, {"name":"NAME_B","value":"BBB"},]';
        expect(parseRawJson(rawInput)).to.deep.equal({
          variables: [],
          errors: [{ type: ERROR_TYPES.INVALID_JSON }],
        });
      });

      it('invalid entry (values not string)', () => {
        const rawInput = '[{"name":"NAME_A","value":0}, {"name":"NAME_B","value":-5}]';
        expect(parseRawJson(rawInput)).to.deep.equal({
          variables: [],
          errors: [{ type: ERROR_TYPES.INVALID_JSON_ENTRY }],
        });
      });

      it('invalid entry (names not string)', () => {
        const rawInput = '[{"name": 0,"value":"0"}, {"name": false,"value":"-5"}]';
        expect(parseRawJson(rawInput)).to.deep.equal({
          variables: [],
          errors: [{ type: ERROR_TYPES.INVALID_JSON_ENTRY }],
        });
      });

      it('invalid entry (names and values not string)', () => {
        const rawInput = '[{"name": 0,"value":0}, {"name": false,"value":-5}]';
        expect(parseRawJson(rawInput)).to.deep.equal({
          variables: [],
          errors: [{ type: ERROR_TYPES.INVALID_JSON_ENTRY }],
        });
      });
    });
  });

  describe('toJson()', () => {
    it('no vars', () => {
      expect(toJson([])).to.equal('[]');
    });

    it('simple var', () => {
      const variables = [{ name: 'NAME_A', value: `AAA` }];
      expect(toJson(variables)).to.equal(
        `[
  {
    "name": "NAME_A",
    "value": "AAA"
  }
]`,
      );
    });

    it('multiple var', () => {
      const variables = [
        { name: 'NAME_A', value: `AAA` },
        { name: 'NAME_B', value: `BBB` },
      ];
      expect(toJson(variables)).to.equal(
        `[
  {
    "name": "NAME_A",
    "value": "AAA"
  },
  {
    "name": "NAME_B",
    "value": "BBB"
  }
]`,
      );
    });

    it('multiple var (unordered)', () => {
      const variables = [
        { name: 'NAME_B', value: `BBB` },
        { name: 'NAME_A', value: `AAA` },
        { name: 'NAME_D', value: `DDD` },
        { name: 'NAME_C', value: `CCC` },
      ];
      expect(toJson(variables)).to.equal(
        `[
  {
    "name": "NAME_A",
    "value": "AAA"
  },
  {
    "name": "NAME_B",
    "value": "BBB"
  },
  {
    "name": "NAME_C",
    "value": "CCC"
  },
  {
    "name": "NAME_D",
    "value": "DDD"
  }
]`,
      );
    });
  });

  describe('toNameEqualsValueString()', () => {
    it('simple var', () => {
      const variables = [{ name: 'NAME_A', value: `AAA` }];
      expect(toNameEqualsValueString(variables)).to.equal([`NAME_A="AAA"`].join('\n'));
    });

    it('multiple vars', () => {
      const variables = [
        { name: 'NAME_A', value: 'AAA' },
        { name: 'NAME_B', value: 'BBBB' },
        { name: 'NAME_C', value: 'CCCCC' },
      ];
      expect(toNameEqualsValueString(variables)).to.equal(
        ['NAME_A="AAA"', 'NAME_B="BBBB"', 'NAME_C="CCCCC"'].join('\n'),
      );
    });

    it('multiple vars (with exports)', () => {
      const variables = [
        { name: 'NAME_A', value: 'AAA' },
        { name: 'NAME_B', value: 'BBBB' },
        { name: 'NAME_C', value: 'CCCCC' },
      ];
      expect(toNameEqualsValueString(variables, { addExports: true })).to.equal(
        ['export NAME_A="AAA";', 'export NAME_B="BBBB";', 'export NAME_C="CCCCC";'].join('\n'),
      );
    });

    it('accept empty values', () => {
      const variables = [
        { name: 'NAME_A', value: 'AAA' },
        { name: 'NAME_B', value: '' },
        { name: 'NAME_C', value: '' },
      ];
      expect(toNameEqualsValueString(variables)).to.equal(['NAME_A="AAA"', 'NAME_B=""', 'NAME_C=""'].join('\n'));
    });

    it('accept space in values', () => {
      const variables = [
        { name: 'NAME_A', value: 'AAA' },
        { name: 'NAME_B', value: 'BBBB BBBB' },
        { name: 'NAME_C', value: 'CCCCC' },
      ];
      expect(toNameEqualsValueString(variables)).to.equal(
        ['NAME_A="AAA"', 'NAME_B="BBBB BBBB"', 'NAME_C="CCCCC"'].join('\n'),
      );
    });

    it('accept simple quotes in values', () => {
      const variables = [
        { name: 'NAME_A', value: 'AAA' },
        { name: 'NAME_B', value: `BBBB'BBBB` },
        { name: 'NAME_C', value: 'CCCCC' },
      ];
      expect(toNameEqualsValueString(variables)).to.equal(
        ['NAME_A="AAA"', `NAME_B="BBBB'BBBB"`, 'NAME_C="CCCCC"'].join('\n'),
      );
    });

    it('accept double quotes in values (and escape them)', () => {
      const variables = [
        { name: 'NAME_A', value: 'AAA' },
        { name: 'NAME_B', value: `BBBB"BBBB` },
        { name: 'NAME_C', value: 'CCCCC' },
      ];
      expect(toNameEqualsValueString(variables)).to.equal(
        ['NAME_A="AAA"', `NAME_B="BBBB\\"BBBB"`, 'NAME_C="CCCCC"'].join('\n'),
      );
    });

    it('accept = in values', () => {
      const variables = [
        { name: 'NAME_A', value: 'AAA' },
        { name: 'NAME_B', value: 'BBBB OTHER=BBBB' },
        { name: 'NAME_C', value: 'CCCCC' },
      ];
      expect(toNameEqualsValueString(variables)).to.equal(
        ['NAME_A="AAA"', 'NAME_B="BBBB OTHER=BBBB"', 'NAME_C="CCCCC"'].join('\n'),
      );
    });

    it('accept line breaks', () => {
      const variables = [
        { name: 'NAME_A', value: `A\na\nA` },
        { name: 'NAME_B', value: 'BBBB' },
      ];
      expect(toNameEqualsValueString(variables)).to.equal([`NAME_A="A\na\nA"`, 'NAME_B="BBBB"'].join('\n'));
    });

    it('accept line breaks (with exports)', () => {
      const variables = [
        { name: 'NAME_A', value: `A\na\nA` },
        { name: 'NAME_B', value: 'BBBB' },
      ];
      expect(toNameEqualsValueString(variables, { addExports: true })).to.equal(
        [`export NAME_A="A\na\nA";`, 'export NAME_B="BBBB";'].join('\n'),
      );
    });

    it('accept line breaks and escape double quotes', () => {
      const variables = [
        { name: 'NAME_A', value: `A\n"a"\nA` },
        { name: 'NAME_B', value: 'BBBB' },
      ];
      expect(toNameEqualsValueString(variables)).to.equal([`NAME_A="A\n\\"a\\"\nA"`, 'NAME_B="BBBB"'].join('\n'));
    });

    it('escape double quotes', () => {
      // " => \"
      const variables = [
        { name: 'NAME_A', value: `AAA` },
        { name: 'NAME_B', value: `BBBB " BBBB` },
        { name: 'NAME_C', value: `CCCCC "CCCCC" CCCCC` },
      ];
      expect(toNameEqualsValueString(variables)).to.equal(
        ['NAME_A="AAA"', `NAME_B="BBBB \\" BBBB"`, `NAME_C="CCCCC \\"CCCCC\\" CCCCC"`].join('\n'),
      );
    });

    it('escape already escaped double quotes', () => {
      // \" => \\\"
      // \\" => \\\\\\"
      // \\\" => \\\\\\\\"
      // ...
      const variables = [
        // AAA \" AAA
        { name: 'NAME_A', value: `AAA \\" AAA` },
        // BBBB \\"BBBB\\" BBBB
        { name: 'NAME_B', value: `BBBB \\\\"BBBB\\\\" BBBB` },
        // CCCCC \\\"CCCCC\\\" CCCCC
        { name: 'NAME_C', value: `CCCCC \\\\\\"CCCCC\\\\\\" CCCCC` },
      ];
      expect(toNameEqualsValueString(variables)).to.equal(
        [
          // AAA \\\" AAA
          `NAME_A="AAA \\\\\\" AAA"`,
          // BBBB \\\\\"BBBB\\\\\" BBBB
          `NAME_B="BBBB \\\\\\\\\\"BBBB\\\\\\\\\\" BBBB"`,
          // CCCCC \\\\\\\"CCCCC\\\\\\\" CCCCC
          `NAME_C="CCCCC \\\\\\\\\\\\\\"CCCCC\\\\\\\\\\\\\\" CCCCC"`,
        ].join('\n'),
      );
    });

    it('not escape slash+n', () => {
      const variables = [
        // AAA
        // AAA
        { name: 'NAME_A', value: `AAA\nAAA` },
        // BBBB\nBBBB
        { name: 'NAME_B', value: `BBBB\\nBBBB` },
      ];
      expect(toNameEqualsValueString(variables)).to.equal(
        [
          'NAME_A="AAA\nAAA"',
          // BBBB\nBBBB
          `NAME_B="BBBB\\nBBBB"`,
        ].join('\n'),
      );
    });

    it('sort vars by name', () => {
      const variables = [
        { name: 'NAME_C', value: `CCCCC` },
        { name: 'NAME_B', value: `BBBB` },
        { name: 'NAME_D', value: `DDDDDD` },
        { name: 'NAME_A', value: `AAA` },
      ];
      expect(toNameEqualsValueString(variables)).to.equal(
        ['NAME_A="AAA"', 'NAME_B="BBBB"', 'NAME_C="CCCCC"', 'NAME_D="DDDDDD"'].join('\n'),
      );
    });
  });

  describe('toNameValueObject()', () => {
    it('multiple vars', () => {
      const variables = [
        { name: 'NAME_A', value: 'AAA' },
        { name: 'NAME_B', value: 'BBBB' },
        { name: 'NAME_C', value: 'CCCCC' },
      ];
      expect(toNameValueObject(variables)).to.deep.equal({
        NAME_A: 'AAA',
        NAME_B: 'BBBB',
        NAME_C: 'CCCCC',
      });
    });

    it('merge ducplicated names (keep last)', () => {
      const variables = [
        { name: 'NAME_A', value: 'AAA' },
        { name: 'NAME_A', value: 'aaa' },
        { name: 'NAME_B', value: 'BBBB' },
      ];
      expect(toNameValueObject(variables)).to.deep.equal({
        NAME_A: 'aaa',
        NAME_B: 'BBBB',
      });
    });

    it('filter invalid names', () => {
      const variables = [
        { name: 'NAME_A', value: 'AAA' },
        { name: 'NAME@BBBB', value: 'BBBB' },
        { name: 'NAME_C', value: 'CCCCC' },
      ];
      expect(toNameValueObject(variables)).to.deep.equal({
        NAME_A: 'AAA',
        NAME_C: 'CCCCC',
      });
    });
  });
});

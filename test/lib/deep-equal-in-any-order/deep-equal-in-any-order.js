// this is an ESM rewrite of https://github.com/oprogramador/deep-equal-in-any-order without lodash
import { sortAny } from './sort-any.js';

/**
 * @param {any} object
 * @returns {any}
 */
function sortDeep(object) {
  if (object instanceof Map) {
    return sortAny([...object]);
  }
  if (!Array.isArray(object)) {
    if (typeof object !== 'object' || object == null || object instanceof Date) {
      return object;
    }

    return Object.fromEntries(Object.entries(object).map(([k, v]) => [k, sortDeep(v)]));
  }
  return sortAny(object.map(sortDeep));
}

/** @type {Chai.ChaiPlugin} */
export const deepEqualInAnyOrder = (chai, utils) => {
  const { Assertion } = chai;
  utils.addMethod(
    Assertion.prototype,
    'equalInAnyOrder',
    /**
     * @param {any} b
     * @param {any} m
     * @this {any}
     */
    function equalInAnyOrder(b, m) {
      const a = utils.flag(this, 'object');
      utils.flag(this, 'object', sortDeep(a));
      this.equal(sortDeep(b), m);
    },
  );

  chai.assert.deepEqualInAnyOrder = (actual, expected, message) =>
    chai.expect(actual).to.deep.equalInAnyOrder(expected, message);
  chai.assert.notDeepEqualInAnyOrder = (actual, expected, message) =>
    chai.expect(actual).to.not.deep.equalInAnyOrder(expected, message);
};

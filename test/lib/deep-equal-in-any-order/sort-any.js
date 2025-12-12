// this is an ESM rewrite of https://github.com/oprogramador/sort-any without lodash
/**
 * @typedef Comparator
 * @type {(a: any, b:any) => number}
 */

const types = {
  undefined: Symbol('undefined'),
  null: Symbol('null'),
  boolean: Symbol('boolean'),
  NaN: Symbol('NaN'),
  number: Symbol('number'),
  string: Symbol('string'),
  symbol: Symbol('symbol'),
  date: Symbol('date'),
  set: Symbol('set'),
  array: Symbol('array'),
  map: Symbol('map'),
  object: Symbol('object'),
};

const typesValues = Object.values(types);
/** @type {Record<symbol, number>} */
const orderedTypes = Object.fromEntries(typesValues.map((symbol, index) => [symbol, index]));

/** @type {Record<symbol, Comparator>} */
const comparators = {
  [types.array]: compareArray,
  [types.set]: (a, b) => compareArray([...a], [...b]),
  [types.map]: (a, b) => compareObject(Object.fromEntries(a), Object.fromEntries(b)),
  [types.number]: standardCompare,
  [types.object]: compareObject,
  [types.string]: standardCompare,
  [types.symbol]: (a, b) => standardCompare(a.toString().slice(0, -1), b.toString().slice(0, -1)),
};

/**
 * @param {symbol} type
 * @return {number}
 */
function getOrderByType(type) {
  return orderedTypes[type];
}

/**
 * @param {any} value
 * @return {symbol}
 */
function getTypeByValue(value) {
  if (typeof value === 'undefined') {
    return types.undefined;
  }
  if (value == null) {
    return types.null;
  }
  if (typeof value === 'boolean') {
    return types.boolean;
  }
  if (typeof value === 'number' && Number.isNaN(value)) {
    return types.NaN;
  }
  if (typeof value === 'number') {
    return types.number;
  }
  if (typeof value === 'string') {
    return types.string;
  }
  if (typeof value === 'symbol') {
    return types.symbol;
  }
  if (value instanceof Date) {
    return types.date;
  }
  if (value instanceof Set) {
    return types.set;
  }
  if (value instanceof Map) {
    return types.map;
  }
  if (Array.isArray(value)) {
    return types.array;
  }

  return types.object;
}

/**
 * @param {any} first
 * @param {any} second
 * @return {number}
 */
function standardCompare(first, second) {
  if (first < second) {
    return -1;
  }
  if (first > second) {
    return 1;
  }

  return 0;
}

/**
 * @param {any} first
 * @param {any} second
 * @return {number}
 */
function compareArray(first, second) {
  if (first.length < second.length) {
    return -1;
  }
  if (second.length < first.length) {
    return 1;
  }
  const sortedFirst = sortAny(first);
  const sortedSecond = sortAny(second);

  for (let i = 0; i < first.length; i++) {
    const compareResult = compare(sortedFirst[i], sortedSecond[i]);
    if (compareResult) {
      return compareResult;
    }
  }

  for (let i = 0; i < first.length; i++) {
    const compareResult = compare(first[i], second[i]);
    if (compareResult) {
      return compareResult;
    }
  }

  return 0;
}

/**
 * @param {any} first
 * @param {any} second
 * @return {number}
 */
function compareObject(first, second) {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);
  if (firstKeys.length < secondKeys.length) {
    return -1;
  }
  if (secondKeys.length < firstKeys.length) {
    return 1;
  }
  const sortedFirstKeys = sortAny(firstKeys);
  const sortedSecondKeys = sortAny(secondKeys);

  for (let i = 0; i < firstKeys.length; i++) {
    const compareResult = compare(sortedFirstKeys[i], sortedSecondKeys[i]);
    if (compareResult) {
      return compareResult;
    }
  }

  for (let i = 0; i < firstKeys.length; i++) {
    const key = sortedFirstKeys[i];
    const compareResult = compare(first[key], second[key]);
    if (compareResult) {
      return compareResult;
    }
  }

  for (let i = 0; i < firstKeys.length; i++) {
    const compareResult = compare(firstKeys[i], secondKeys[i]);
    if (compareResult) {
      return compareResult;
    }
  }

  return 0;
}

/**
 * @param {any} first
 * @param {any} second
 * @return {number}
 */
function compare(first, second) {
  const firstType = getTypeByValue(first);
  const secondType = getTypeByValue(second);
  const firstOrder = getOrderByType(firstType);
  const secondOrder = getOrderByType(secondType);
  const differenceByType = firstOrder - secondOrder;
  if (differenceByType) {
    return differenceByType;
  }
  const comparator = comparators[firstType] || standardCompare;

  return comparator(first, second);
}

/**
 *
 * @param {Array<any>} array
 * @return {Array<any>}
 */
export function sortAny(array) {
  const undefinedsArray = array.filter((x) => typeof x === 'undefined');
  const notUndefinedsArray = array.filter((x) => typeof x !== 'undefined');

  return [...undefinedsArray, ...[...notUndefinedsArray].sort(compare)];
}

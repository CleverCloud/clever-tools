'use strict';

const _countBy = require('lodash/countBy.js');
const readline = require('readline');
const { ERROR_TYPES, parseRaw, toNameValueObject, validateName } = require('@clevercloud/client/cjs/utils/env-vars.js');

function readStdin () {

  return new Promise((resolve, reject) => {

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const lines = [];
    rl.on('line', (line) => {
      lines.push(line);
    });

    rl.on('close', () => {
      const text = lines.join('\n');
      resolve(text);
    });

    rl.on('error', reject);
  });
}

// The JSON input format for variables is:
// an array of objects, each having:
// a "name" property with a string and value
// a "value" property with a string and value
// TODO: This should be moved and unit tested in the clever-client repo
function parseFromJson (rawStdin) {

  let variables;
  try {
    variables = JSON.parse(rawStdin);
  }
  catch (e) {
    throw new Error('Error when parsing JSON input', e);
  }

  if (!Array.isArray(variables) || variables.some((entry) => typeof entry !== 'object')) {
    throw new Error('The input was valid JSON but it does not follow the correct format. It must be an array of objects.');
  }

  const someEntriesDontHaveNameAndValueAsString = variables.some(({ name, value }) => {
    return (typeof name !== 'string') || (typeof value !== 'string');
  });
  if (someEntriesDontHaveNameAndValueAsString) {
    throw new Error('The input was a valid JSON array of objects but all entries must have properties "name" and "value" of type string. Ex: { "name": "THE_NAME", "value": "the value" }');
  }

  const namesOccurences = _countBy(variables, 'name');
  const duplicatedNames = Object
    .entries(namesOccurences)
    .filter(([name, count]) => count > 1)
    .map(([name]) => `"${name}"`)
    .join(', ');

  if (duplicatedNames.length !== 0) {
    throw new Error(`Some variable names defined multiple times: ${duplicatedNames}`);
  }

  const invalidNames = variables
    .filter(({ name }) => !validateName(name))
    .map(({ name }) => `"${name}"`)
    .join(', ');

  if (invalidNames.length !== 0) {
    throw new Error(`Some variable names are invalid: ${invalidNames}`);
  }

  return toNameValueObject(variables);
}

function parseFromNameEqualsValue (rawStdin) {
  const { variables, errors } = parseRaw(rawStdin);

  if (errors.length !== 0) {

    const formattedErrors = errors
      .map(({ type, name, pos }) => {
        if (type === ERROR_TYPES.INVALID_NAME) {
          return `line ${pos.line}: ${name} is not a valid variable name`;
        }
        if (type === ERROR_TYPES.DUPLICATED_NAME) {
          return `line ${pos.line}: be careful, the name ${name} is already defined`;
        }
        if (type === ERROR_TYPES.INVALID_LINE) {
          return `line ${pos.line}: this line is not valid, the correct pattern is: NAME="VALUE"`;
        }
        if (type === ERROR_TYPES.INVALID_VALUE) {
          return `line ${pos.line}: the value is not valid, if you use quotes, you need to escape them like this: \\" or quote the whole value.`;
        }
        return 'Unknown error in your input';
      }).join('\n');

    throw new Error(formattedErrors);
  }

  return toNameValueObject(variables);
}

async function readVariablesFromStdin (format) {

  const rawStdin = await readStdin();

  switch (format) {
    case 'name-equals-value':
      return parseFromNameEqualsValue(rawStdin);
    case 'json':
      return parseFromJson(rawStdin);
    default:
      throw new Error('Unrecognized environment input format. Available formats are \'name-equals-value\' and \'json\'');
  }
}

module.exports = {
  readVariablesFromStdin,
};

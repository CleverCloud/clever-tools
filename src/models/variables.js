'use strict';

const readline = require('readline');
const { ERROR_TYPES, parseRaw, toNameValueObject } = require('@clevercloud/client/cjs/utils/env-vars.js');

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

function parseFromJSON (rawStdin) {
  try {
    const json = JSON.parse(rawStdin);
    // The JSON structure is not checked before sending it to the API.
    // In the case of an error, the API call will fail and an error will
    // be logged. It could be possible to add a check here to improve the
    // UX a bit (but we'd have to make sure it's consistent with what the
    // API checks).
    return json;
  }
  catch (e) {
    throw new Error('Error when parsing json', e);
  }
}

function parseEnvLines (rawStdin) {
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

async function readVariablesFromStdin (format = 'env') {

  const rawStdin = await readStdin();

  switch (format) {
    case 'env':
      return parseEnvLines(rawStdin);
    case 'json':
      return parseFromJSON(rawStdin);
    default:
      throw new Error("Unrecognized environment input format. Available formats are 'env' and 'json'");
  }
}

module.exports = {
  readVariablesFromStdin,
};

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

async function readVariablesFromStdin () {

  const rawStdin = await readStdin();
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

module.exports = {
  readVariablesFromStdin,
};

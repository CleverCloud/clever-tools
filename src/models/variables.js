'use strict';

const readline = require('readline');

const _ = require('lodash');
const Bacon = require('baconjs');

function parseLine (line) {
  const p = line.split('=');
  const key = p[0];
  p.shift();
  const value = p.join('=');
  if (line.trim()[0] !== '#' && p.length > 0) {
    return [key.trim(), value.trim()];
  }
  return null;
};

function render (variables, addExport) {
  return _(variables)
    .map(({ name, value }) => {
      if (addExport) {
        const escapedValue = value.replace(/'/g, '\'\\\'\'');
        return `export ${name}='${escapedValue}';`;
      }
      return `${name}=${value}`;
    })
    .join('\n');
};

function readFromStdin () {
  return Bacon.fromBinder((sink) => {

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const vars = {};

    rl.on('line', (line) => {
      const res = parseLine(line);
      if (res) {
        const [name, value] = res;
        vars[name] = value;
      }
    });

    rl.on('close', () => {
      sink(new Bacon.Next(vars));
      sink(new Bacon.End());
    });
  });
};

module.exports = {
  parseLine,
  render,
  readFromStdin,
};

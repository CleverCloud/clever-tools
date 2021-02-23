'use strict';

const colors = require('colors/safe');

function formatId (id) {
  return colors.dim(id);
}

function formatString (str, decorated = true) {
  const string = decorated ? `'${str}'` : str;
  return colors.green(string);
}

function formatNumber (number) {
  return colors.yellow(number);
}

function formatIp (ip) {
  return colors.cyan(ip);
}

function formatUrl (url, decorated = true) {
  const string = decorated ? `<${url}>` : url;
  return colors.cyan(string);
}

function formatCommand (command, decorated = true) {
  const string = decorated ? `\`${command}\`` : command;
  return colors.magenta(string);
}

module.exports = {
  formatId,
  formatString,
  formatNumber,
  formatIp,
  formatUrl,
  formatCommand,
};

'use strict';

const colors = require('colors/safe');

function formatId (id, colored = true) {
  return colored ? colors.dim(id) : id;
}

function formatString (str, colored = true, decorated = true) {
  const string = decorated ? `'${str}'` : str;
  return colored ? colors.green(string) : string;
}

function formatNumber (number, colored = true) {
  return colored ? colors.yellow(number) : number;
}

function formatIp (ip, colored = true) {
  return colored ? colors.cyan(ip) : ip;
}

function formatUrl (url, colored = true, decorated = true) {
  const string = decorated ? `<${url}>` : url;
  return colored ? colors.cyan(string) : string;
}

function formatCommand (command, colored = true, decorated = true) {
  const string = decorated ? `\`${command}\`` : command;
  return colored ? colors.magenta(string) : string;
}

module.exports = {
  formatId,
  formatString,
  formatNumber,
  formatIp,
  formatUrl,
  formatCommand,
};

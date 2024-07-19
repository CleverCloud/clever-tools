import colors from 'colors/safe.js';

export function formatId (id) {
  return colors.dim(id);
}

export function formatString (str, decorated = true) {
  const string = decorated ? `'${str}'` : str;
  return colors.green(string);
}

export function formatNumber (number) {
  return colors.yellow(number);
}

export function formatIp (ip) {
  return colors.cyan(ip);
}

export function formatUrl (url, decorated = true) {
  const string = decorated ? `<${url}>` : url;
  return colors.cyan(string);
}

export function formatCommand (command, decorated = true) {
  const string = decorated ? `\`${command}\`` : command;
  return colors.magenta(string);
}

export function formatCode (code, decorated = true) {
  return formatCommand(code, decorated);
}

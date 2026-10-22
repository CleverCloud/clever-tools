/**
 * Check if a specific parameter exists in the command line arguments.
 * With a value, both `--param value` and `--param=value` are matched.
 * @param {string} param
 * @param {string} [paramValue]
 * @returns {boolean}
 */
export function hasParam(param, paramValue) {
  const index = process.argv.indexOf(param);
  if (paramValue == null) {
    return index !== -1;
  }
  if (index !== -1 && process.argv[index + 1] === paramValue) {
    return true;
  }
  return process.argv.includes(`${param}=${paramValue}`);
}

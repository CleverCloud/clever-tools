/**
 * Check if a specific parameter exists in the command line arguments.
 * @param {string} param
 * @param {string} [paramValue]
 * @return {boolean}
 */
export function hasParam(param, paramValue) {
  const index = process.argv.indexOf(param);
  if (index === -1) {
    return false;
  }
  if (paramValue != null) {
    return process.argv[index + 1] === paramValue;
  }
  return true;
}

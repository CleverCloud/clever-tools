const fs = require('fs');
const path = require('path');

let pkg;

function getPackageJson () {
  if (pkg == null) {
    const pkgJson = fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8');
    pkg = JSON.parse(pkgJson);
  }
  return pkg;
}

module.exports = { getPackageJson };

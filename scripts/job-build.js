'use strict';

const cfg = require('./config');
const del = require('del');
const pkg = require('pkg').exec;

async function run () {

  const { archList, nodeVersion, releasesDir } = cfg;
  const version = cfg.getVersion();

  del.sync(releasesDir);

  for (let arch of archList) {
    console.log(`Building pkg for ${arch} ...\n`);
    const filepath = cfg.getBinaryFilepath(arch, version);
    await pkg([`.`, `-t`, `node${nodeVersion}-${arch}`, `-o`, filepath]);
    console.log(`\nBuilding pkg for ${arch} DONE!\n`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

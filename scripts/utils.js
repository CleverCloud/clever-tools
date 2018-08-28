'use strict';

const childProcess = require('child_process');

function exec (command, cwd) {
  console.log(`Executing command: ${command}`);
  return new Promise((resolve, reject) => {
    childProcess.exec(command, { cwd }, (err) => err ? reject(err) : resolve());
  });
}

module.exports = { exec };

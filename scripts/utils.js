'use strict';

const childProcess = require('child_process');

function exec (command, cwd) {
  console.log(`Executing command: ${command}`);
  return new Promise((resolve, reject) => {
    childProcess.exec(command, { cwd }, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr);
        return reject(err);
      }
      console.log(stdout);
      return resolve();
    });
  });
}

module.exports = { exec };

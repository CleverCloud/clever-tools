'use strict';

const { writeFileSync, rmSync } = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { loadOAuthConf } = require('../models/configuration.js');

const gitCredentialsPath = path.join(os.tmpdir(), 'cc-git-credentials');

async function withGitAuth (callback) {

  const { token, secret } = await loadOAuthConf();
  // TODO use real remote URL
  const url = new URL('https://push-n3-par-clevercloud-customers.services.clever-cloud.com');
  url.username = token;
  url.password = secret;
  writeFileSync(gitCredentialsPath, url.toString() + '\n');

  return callback()
    .then((result) => {
      rmSync(gitCredentialsPath);
      return result;
    })
    .catch((error) => {
      rmSync(gitCredentialsPath);
      throw error;
    });
}

async function runGitCommand (params) {
  return withGitAuth(() => {
    return new Promise((resolve, reject) => {
      const allParams = [
        '-c',
        `credential.helper=store --file=${gitCredentialsPath}`,
        ...params,
      ];
      const gitProcess = spawn('git', allParams, {
        stdio: 'inherit',
      });
      gitProcess.on('exit', resolve);
      gitProcess.on('error', reject);
    });
  });
}

module.exports = { runGitCommand };

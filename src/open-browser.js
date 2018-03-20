'use strict';

const { spawn } = require('child_process');
const nodeUrl = require('url');

const Bacon = require('baconjs');

const Logger = require('./logger.js');

function getCommand (url) {
  Logger.debug('Get the right command to open a tab in a browser…');

  try {
    const { protocol, hostname } = nodeUrl.parse(url);
    if (protocol === null || hostname === null) {
      return new Bacon.Error('Invalid url provided');
    }
  } catch (e) {
    return new Bacon.Error('Invalid url provided');
  }

  const args = [url];

  switch (process.platform) {
    case 'darwin':
      return Bacon.constant({ command: 'open', args });
    case 'linux':
      return Bacon.constant({ command: 'xdg-open', args });
    case 'win32':
      return Bacon.constant({ command: 'explorer.exe', args });
    default:
      return new Bacon.Error('Unsupported platform: ' + process.platform);
  }
}

function run (command) {
  return Bacon.fromBinder((sink) => {
    Logger.debug('Opening browser');
    const browser = spawn(command.command, command.args, {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
    });

    // If we have to launch the browser,
    // unref the child process from the parrent process
    browser.unref();

    sink(new Bacon.Next());
    sink(new Bacon.End());

    return () => {
    };
  });
}

function openPage (url) {
  return getCommand(url)
    .flatMapLatest((command) => run(command));
}

module.exports = { getCommand, run, openPage };

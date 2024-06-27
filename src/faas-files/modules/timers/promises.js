import { promisify } from 'util.js';
import exports from 'timers.js';

function promisifySetTimeout (delay, value, _option) {
  return new Promise((resolve, _reject) => {
    exports.setTimeout(resolve(value), delay);
  });
}

function promisifySetImmediate (delay, value, _option) {
  return new Promise((resolve, _reject) => {
    exports.setImmediate(resolve(value), delay);
  });
}

const setTimeout = promisifySetTimeout;
const setImmediate = promisifySetImmediate;
const setInterval = promisify(exports.setInterval);

const promises = {
  setTimeout,
  setImmediate,
  setInterval,
};

export { promises as default, setImmediate, setInterval, setTimeout };

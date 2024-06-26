'use strict';

// Inspirations:
// https://github.com/sindresorhus/p-defer/blob/master/index.js
// https://github.com/ljharb/promise-deferred/blob/master/index.js

// When you mix async/await APIs with event emitters callbacks, it's hard to keep a proper error flow without a good old deferred.
class Deferred {

  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

function truncateWithEllipsis (length, string) {
  if (string.length > length - 1) {
    return string.substring(0, length - 1) + '…';
  }
  return string;
}

module.exports = { Deferred, truncateWithEllipsis };

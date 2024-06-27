import process from 'process';

const exports$2 = {};
let _dewExec$1 = false;

const _global$1 = typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : global;

function dew$1 () {
  if (_dewExec$1) {
    return exports$2;
  }
  _dewExec$1 = true;
  const process$1 = process;

  (function (global, undefined$1) {

    if (global.setImmediate) {
      return;
    }

    let nextHandle = 1; // Spec says greater than zero

    const tasksByHandle = {};
    let currentlyRunningATask = false;
    const doc = global.document;
    let registerImmediate;

    function setImmediate (callback) {
      const arguments$1 = arguments;

      // Callback can either be a function or a string
      if (typeof callback !== 'function') {
        callback = new Function('' + callback);
      } // Copy function arguments

      const args = new Array(arguments.length - 1);

      for (let i = 0; i < args.length; i++) {
        args[i] = arguments$1[i + 1];
      } // Store and register the task

      const task = {
        callback: callback,
        args: args,
      };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate (handle) {
      delete tasksByHandle[handle];
    }

    function run (task) {
      const callback = task.callback;
      const args = task.args;

      switch (args.length) {
        case 0:
          callback();
          break;

        case 1:
          callback(args[0]);
          break;

        case 2:
          callback(args[0], args[1]);
          break;

        case 3:
          callback(args[0], args[1], args[2]);
          break;

        default:
          callback.apply(undefined$1, args);
          break;
      }
    }

    function runIfPresent (handle) {
      // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
      // So if we're currently running a task, we'll need to delay this invocation.
      if (currentlyRunningATask) {
        // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
        // "too much recursion" error.
        setTimeout(runIfPresent, 0, handle);
      }
      else {
        const task = tasksByHandle[handle];

        if (task) {
          currentlyRunningATask = true;

          try {
            run(task);
          }
          finally {
            clearImmediate(handle);
            currentlyRunningATask = false;
          }
        }
      }
    }

    function installNextTickImplementation () {
      registerImmediate = function (handle) {
        process$1.nextTick(function () {
          runIfPresent(handle);
        });
      };
    }

    function canUsePostMessage () {
      // The test against `importScripts` prevents this implementation from being installed inside a web worker,
      // where `global.postMessage` means something completely different and can't be used for this purpose.
      if (global.postMessage && !global.importScripts) {
        let postMessageIsAsynchronous = true;
        const oldOnMessage = global.onmessage;

        global.onmessage = function () {
          postMessageIsAsynchronous = false;
        };

        global.postMessage('', '*');
        global.onmessage = oldOnMessage;
        return postMessageIsAsynchronous;
      }
    }

    function installPostMessageImplementation () {
      // Installs an event handler on `global` for the `message` event: see
      // * https://developer.mozilla.org/en/DOM/window.postMessage
      // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages
      const messagePrefix = 'setImmediate$' + Math.random() + '$';

      const onGlobalMessage = function (event) {
        if (event.source === global && typeof event.data === 'string' && event.data.indexOf(messagePrefix) === 0) {
          runIfPresent(+event.data.slice(messagePrefix.length));
        }
      };

      if (global.addEventListener) {
        global.addEventListener('message', onGlobalMessage, false);
      }
      else {
        global.attachEvent('onmessage', onGlobalMessage);
      }

      registerImmediate = function (handle) {
        global.postMessage(messagePrefix + handle, '*');
      };
    }

    function installMessageChannelImplementation () {
      const channel = new MessageChannel();

      channel.port1.onmessage = function (event) {
        const handle = event.data;
        runIfPresent(handle);
      };

      registerImmediate = function (handle) {
        channel.port2.postMessage(handle);
      };
    }

    function installReadyStateChangeImplementation () {
      const html = doc.documentElement;

      registerImmediate = function (handle) {
        // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
        // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
        let script = doc.createElement('script');

        script.onreadystatechange = function () {
          runIfPresent(handle);
          script.onreadystatechange = null;
          html.removeChild(script);
          script = null;
        };

        html.appendChild(script);
      };
    }

    function installSetTimeoutImplementation () {
      registerImmediate = function (handle) {
        setTimeout(runIfPresent, 0, handle);
      };
    } // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.

    let attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global; // Don't get fooled by e.g. browserify environments.

    if ({}.toString.call(global.process) === '[object process]') {
      // For Node.js before 0.9
      installNextTickImplementation();
    }
    else if (canUsePostMessage()) {
      // For non-IE10 modern browsers
      installPostMessageImplementation();
    }
    else if (global.MessageChannel) {
      // For web workers, where supported
      installMessageChannelImplementation();
    }
    else if (doc && 'onreadystatechange' in doc.createElement('script')) {
      // For IE 6–8
      installReadyStateChangeImplementation();
    }
    else {
      // For older browsers
      installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
  })(typeof self === 'undefined' ? typeof _global$1 === 'undefined' ? exports$2 : _global$1 : self);

  return exports$2;
}

const exports$1 = {};
let _dewExec = false;

const _global = typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : global;

function dew () {
  if (_dewExec) {
    return exports$1;
  }
  _dewExec = true;
  const scope = typeof _global !== 'undefined' && _global || typeof self !== 'undefined' && self || window;
  const apply = Function.prototype.apply; // DOM APIs, for completeness

  exports$1.setTimeout = function () {
    return new Timeout(apply.call(setTimeout, scope, arguments), clearTimeout);
  };

  exports$1.setInterval = function () {
    return new Timeout(apply.call(setInterval, scope, arguments), clearInterval);
  };

  exports$1.clearTimeout = exports$1.clearInterval = function (timeout) {
    if (timeout) {
      timeout.close();
    }
  };

  function Timeout (id, clearFn) {
    (this || _global)._id = id;
    (this || _global)._clearFn = clearFn;
  }

  Timeout.prototype.unref = Timeout.prototype.ref = function () {};

  Timeout.prototype.close = function () {
    (this || _global)._clearFn.call(scope, (this || _global)._id);
  }; // Does not start the time, just sets up the members needed.

  exports$1.enroll = function (item, msecs) {
    clearTimeout(item._idleTimeoutId);
    item._idleTimeout = msecs;
  };

  exports$1.unenroll = function (item) {
    clearTimeout(item._idleTimeoutId);
    item._idleTimeout = -1;
  };

  exports$1._unrefActive = exports$1.active = function (item) {
    clearTimeout(item._idleTimeoutId);
    const msecs = item._idleTimeout;

    if (msecs >= 0) {
      item._idleTimeoutId = setTimeout(function onTimeout () {
        if (item._onTimeout) {
          item._onTimeout();
        }
      }, msecs);
    }
  }; // setimmediate attaches itself to the global object

  dew$1(); // On some exotic environments, it's not clear which object `setimmediate` was
  // able to install onto.  Search each possibility in the same order as the
  // `setimmediate` library.

  exports$1.setImmediate = typeof self !== 'undefined' && self.setImmediate || typeof _global !== 'undefined' && _global.setImmediate || exports$1 && exports$1.setImmediate;
  exports$1.clearImmediate = typeof self !== 'undefined' && self.clearImmediate || typeof _global !== 'undefined' && _global.clearImmediate || exports$1 && exports$1.clearImmediate;
  return exports$1;
}

const exports = dew();
exports.setTimeout; exports.setInterval; exports.clearTimeout; exports.clearInterval; exports.enroll; exports.unenroll; exports._unrefActive; exports.active; exports.setImmediate; exports.clearImmediate;

const _unrefActive = exports._unrefActive;
const active = exports.active;
const clearImmediate = exports.clearImmediate;
const clearInterval$1 = exports.clearInterval;
const clearTimeout$1 = exports.clearTimeout;
const enroll = exports.enroll;
const setImmediate = exports.setImmediate;
const setInterval$1 = exports.setInterval;
const setTimeout$1 = exports.setTimeout;
const unenroll = exports.unenroll;

export { _unrefActive, active, clearImmediate, clearInterval$1 as clearInterval, clearTimeout$1 as clearTimeout, exports as default, enroll, setImmediate, setInterval$1 as setInterval, setTimeout$1 as setTimeout, unenroll };

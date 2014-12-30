var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var debug = _.partial(console.log.bind(console), "[GIT]");
var error = _.partial(console.error.bind(console), "[ERROR]");

var Git = module.exports;

Git.createRemote = function(name, remoteUrl) {
  // Replace git+ssh:// by ssh://, otherwise we get a "Malformed URL" error by nodegit
  var url = remoteUrl.replace(/^git\+/, "");

  debug("Open the local repository…");
  var s_repository = Bacon.fromPromise(nodegit.Repository.open(path.resolve("."))).toProperty();

  var s_existingRemote = s_repository.flatMapLatest(function(repository) {
    debug("Load the \"" + name + "\" remote…");
    return Bacon.fromPromise(nodegit.Remote.load(repository, name))
  });

  var s_existingValidRemote = s_existingRemote.skipErrors().flatMapLatest(function(remote) {
    debug("Check that the current \"" + name + "\" remote point to the right URL…");
    return remote.url() == url ? Bacon.once(remote) : new Bacon.Error("The \"" + name + "\" remote already exist and does not point to " + url);
  });

  // Create a remote only if it does not already exist
  var s_newRemote = s_existingRemote.errors().flatMapError(function() {
    debug("Create a \"" + name + "\" remote pointing to " + url);
    return !nodegit.Remote.validUrl(url) ? new Bacon.Error("The remote url (" + url + ") is invalid.") : s_repository.flatMapLatest(function(repository) {
      return Bacon.fromPromise(nodegit.Remote.create(repository, name, url));
    });
  });

  debug("Use ssh-agent for authentication…");
  return Bacon.mergeAll(s_existingValidRemote, s_newRemote).map(function(remote) {
    remote.setCallbacks({
      credentials: function(url, username) {
        return nodegit.Cred.sshKeyFromAgent(username);
      }
    });

    return remote;
  });
};

Git.fetch = function(remote) {
  debug("Create a git signature…");
  var signature = nodegit.Signature.now("clever-tools", "support@clever-cloud.com");

  debug("Fetch " + remote.name() + "…");
  return Bacon.fromPromise(remote.fetch(signature, null)).map(remote);
};

Git.keepFetching = function(timeout, remote) {
  debug("Create a git signature…");
  var signature = nodegit.Signature.now("clever-tools", "support@clever-cloud.com");

  var s_timeout = timeout > 0 ? Bacon.later(timeout, {}) : Bacon.never();
  var fetch = function() {
    process.stdout.write(".");
    return Bacon.fromPromise(remote.fetch(signature, null)).map(remote).flatMapError(function(error) {
      return (error.message != "Early EOF") ? new Bacon.Error(error) : Bacon.later(10000, {}).flatMapLatest(function() {
        return fetch();
      });
    });
  };

  debug("Wait for " + remote.name() + " to be fetchable…");
  var s_fetch = fetch().takeUntil(s_timeout).doAction(function() {
    process.stdout.write("\n");
  });

  return s_fetch;
};

Git.push = function(remote) {
  debug("Prepare the push…");
  return Bacon.fromPromise(nodegit.Push.create(remote))
    .flatMapLatest(function(push) {
      debug("Add the refspec…");

      var retval = push.addRefspec("refs/heads/master:refs/heads/master");

      return retval == 0 ? Bacon.once(push) : new Bacon.Error();
    })
    .flatMapLatest(function(push) {
      debug("Send data…");

      return Bacon.fromPromise(push.finish()).map(push);
    })
    .flatMapLatest(function(push) {
      var success = push.unpackOk();

      return success ? Bacon.once(push) : new Bacon.Error();
    })
    .flatMapError(function(error) {
      var errors = (error ? [new Bacon.Error(error)] : []).concat([
        new Bacon.Error("Cannot push your source code to Clever-Cloud.")
      ]);

      return Bacon.fromArray(errors);
    });
};

var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");

var Logger = require("../logger.js");

var Git = module.exports;

Git.GIT_BRANCH_LOCAL = 1;

Git.getRepository = function() {
  Logger.debug("Open the local repository…");
  return Bacon.fromPromise(nodegit.Repository.open(path.resolve("."))).toProperty();
};

Git.getRemote = function(name) {
  return Git.getRepository().flatMapLatest(function(repository) {
    Logger.debug("Load the \"" + name + "\" remote…");
    return Bacon.fromPromise(nodegit.Remote.load(repository, name)).toProperty().map(function(remote) {
      Logger.debug("Use ssh-agent for authentication…");
      remote.setCallbacks({
        credentials: function(url, username) {
          return nodegit.Cred.sshKeyFromAgent(username);
        }
      });

      return remote;
    });
  });
};

Git.getBranch = function(name) {
  return Git.getRepository().flatMapLatest(function(repository) {
    return Bacon.fromPromise(nodegit.Branch.lookup(repository, name, Git.GIT_BRANCH_LOCAL));
  }).toProperty();
};

Git.createRemote = function(name, remoteUrl) {
  // Replace git+ssh:// by ssh://, otherwise we get a "Malformed URL" error by nodegit
  var url = remoteUrl.replace(/^git\+/, "");

  var s_existingRemote = Git.getRemote(name);

  var s_existingValidRemote = s_existingRemote.skipErrors().flatMapLatest(function(remote) {
    Logger.debug("Check that the current \"" + name + "\" remote point to the right URL…");
    return remote.url() == url ? Bacon.once(remote) : new Bacon.Error("The \"" + name + "\" remote already exist and does not point to " + url);
  });

  // Create a remote only if it does not already exist
  var s_newRemote = s_existingRemote.errors().flatMapError(function() {
    Logger.debug("Create a \"" + name + "\" remote pointing to " + url);
    return !nodegit.Remote.validUrl(url) ? new Bacon.Error("The remote url (" + url + ") is invalid.") : Git.getRepository().flatMapLatest(function(repository) {
      return Bacon.fromPromise(nodegit.Remote.create(repository, name, url)).map(function(remote) {
        Logger.debug("Use ssh-agent for authentication…");
        remote.setCallbacks({
          credentials: function(url, username) {
            return nodegit.Cred.sshKeyFromAgent(username);
          }
        });

        return remote;
      });
    });
  });

  return Bacon.mergeAll(s_existingValidRemote, s_newRemote);
};

Git.fetch = function(remote) {
  Logger.debug("Create a git signature…");
  var signature = nodegit.Signature.now("clever-tools", "support@clever-cloud.com");

  Logger.debug("Fetch " + remote.name() + "…");
  return Bacon.fromPromise(remote.fetch(signature, null)).map(remote);
};

Git.keepFetching = function(timeout, remote) {
  Logger.debug("Create a git signature…");
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

  Logger.debug("Wait for " + remote.name() + " to be fetchable…");
  var s_fetch = fetch().takeUntil(s_timeout).doAction(function() {
    process.stdout.write("\n");
  });

  return s_fetch;
};

Git.push = function(remote, branch) {
  Logger.debug("Prepare the push…");
  return Bacon.fromPromise(nodegit.Push.create(remote))
    .flatMapLatest(function(push) {
      Logger.debug("Add the refspec…");

      return Git.getBranch(branch).flatMapLatest(function(branch) {
        var retval = push.addRefspec(branch + ":refs/heads/master");
        return retval == 0 ? Bacon.once(push) : new Bacon.Error();
      });
    })
    .flatMapLatest(function(push) {
      Logger.debug("Send data…");

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

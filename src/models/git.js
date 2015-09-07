var _ = require("lodash");
var path = require("path");
var Bacon = require("baconjs");
var nodegit = require("nodegit");
var autocomplete = require("cliparse").autocomplete;
var Promise = require("bluebird");

var Logger = require("../logger.js");

module.exports = function(repositoryPath) {

  var Git = {};
  Git.GIT_BRANCH_LOCAL = 1;

  Git.getRepository = function() {
    Logger.debug("Open the local repository…");
    return Bacon.fromPromise(nodegit.Repository.open(repositoryPath)).toProperty();
  };

  Git.getRemote = function(name) {
    return Git.getRepository().flatMapLatest(function(repository) {
      Logger.debug("Load the \"" + name + "\" remote…");
      return Bacon.fromPromise(nodegit.Remote.lookup(repository, name)).toProperty().map(function(remote) {
        Logger.debug("Use ssh-agent for authentication…");
        remote.setCallbacks({
          certificateCheck: function() { return 1; },
          credentials: function(url, username) {
            return nodegit.Cred.sshKeyFromAgent(username);
          }
        });
        return remote;
      });
    });
  };

  Git.getCurrentBranch = function() {
    return Git.getRepository().flatMapLatest(function(repository) {
      return Bacon.fromPromise(repository.getCurrentBranch());
    });
  };

  Git.getBranch = function(name) {
    return Git.getRepository().flatMapLatest(function(repository) {
      return Bacon.fromPromise(nodegit.Branch.lookup(repository, name, Git.GIT_BRANCH_LOCAL));
    }).toProperty();
  };

  Git.getBranches = function() {
    return Git.getRepository().flatMapLatest(function(repository) {
      return Bacon.fromPromise(repository.getReferences())
      .map(function(refs) {
        return _.map(_.filter(refs, function(ref) {
          return ref.isBranch();
        }), function(ref) { return ref.shorthand(); });
      });
    }).toProperty();
  };

  Git.completeBranches = function() {
    return Git.getBranches().firstToPromise(Promise).then(autocomplete.words);
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
      return Git.getRepository().flatMapLatest(function(repository) {
        Bacon.fromPromise(nodegit.Remote.create(repository, name, url));
        Logger.debug("Created remote " + name);
        return Git.getRemote(name);
      }).flatMapLatest(function(remote) {
        Logger.debug("Use ssh-agent for authentication…");
        remote.setCallbacks({
          credentials: function(url, username) {
            return nodegit.Cred.sshKeyFromAgent(username);
          }
        });

        return remote;
      });
    });

    return Bacon.mergeAll(s_existingValidRemote, s_newRemote);
  };

  Git.fetch = function(remote) {
    Logger.debug("Create a git signature…");
    var signature = nodegit.Signature.now("clever-tools", "support@clever-cloud.com");

    Logger.debug("Fetching " + remote.name() + "…");
    return Bacon.fromPromise(remote.fetch([remote.name()], signature, null)).map(remote);
  };

  Git.keepFetching = function(timeout, remote) {
    Logger.debug("Create a git signature…");
    var signature = nodegit.Signature.now("clever-tools", "support@clever-cloud.com");

    var s_timeout = timeout > 0 ? Bacon.later(timeout, {}) : Bacon.never();
    var fetch = function() {
      Logger.debug("Fetching " + remote.name());
      return Bacon.fromPromise(remote.fetch(["refs/heads/master"], signature, null)).map(remote).flatMapError(function(error) {
        return (error.message != "Early EOF") ? new Bacon.Error(error) : Bacon.later(10000, {}).flatMapLatest(function() {
          return fetch();
        });
      });
    };

    Logger.debug("Wait for " + remote.name() + " to be fetchable…");
    var s_fetch = fetch().takeUntil(s_timeout).doAction(function() {
      Logger.debug("Fetched " + remote.name());
    });

    return s_fetch;
  };

  Git.getRemoteCommitId = function(remoteName) {
    return Git.getRepository().flatMapLatest(function(repo) {
      return Bacon.fromPromise(repo.getReferenceCommit(remoteName + '/master'))
            .map(function(commit) {
              return commit.id().toString();
            });
    });
  };

  Git.getCommitId = function(branchName) {
    var s_branch = branchName == "" ? Git.getCurrentBranch() : Git.getBranch(branchName);

    return Git.getRepository().flatMapLatest(function(repo) {
      return s_branch.flatMapLatest(function(branch) {
        return Bacon.fromPromise(repo.getBranchCommit(branch.name()))
              .map(function(commit) {
                return commit.id().toString();
              });
      });
    });
  };

  Git.push = function(remote, branch, s_commitId) {
    Logger.debug("Prepare the push…");

    var s_current_branch = Git.getCurrentBranch();
    var s_branch = branch == "" ? s_current_branch : Git.getBranch(branch);

    return s_branch.flatMapLatest(function(branch) {

      return s_commitId.flatMapLatest(function(commitIdToPush) {
        return Git.getRemoteCommitId(remote.name()).flatMapLatest(function(remoteCommitId) {
          if(remoteCommitId != commitIdToPush) {
            remote.setCallbacks({
              certificateCheck: function() { return 1; },
              credentials: function(url, userName) {
                return nodegit.Cred.sshKeyFromAgent(userName);
              }
            });

            Logger.debug("Preparing the push");
            return Bacon.fromPromise(remote.push([branch + ":refs/heads/master"]));
          } else {
            return new Bacon.Error("Nothing to push");
          }
        });
      });
    });
  };

  return Git;
};

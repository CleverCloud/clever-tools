var _ = require("lodash");
var conf = require("./configuration.js");
var path = require("path");
var fs = require("fs");
var Bacon = require("baconjs");
var nodegit = require("nodegit");
var autocomplete = require("cliparse").autocomplete;
var Promise = require("bluebird");

var Logger = require("../logger.js");

module.exports = function(repositoryPath) {

  var Git = {};
  Git.GIT_BRANCH_LOCAL = 1;

  Git.fetchOptions = Git.pushOptions = function(token, secret) {
    return { callbacks: {
      certificateCheck: function() { return 1; },
      credentials: function(url, username) {
        if(url.substr(0, 8) === "https://") {
          return nodegit.Cred.userpassPlaintextNew(token, secret);
        } else {
          return nodegit.Cred.sshKeyFromAgent(username);
        }
      }
    }};
  };


  Git.getRepository = function(candidatePath) {
    if(typeof candidatePath == "undefined") {
      candidatePath = repositoryPath;
    }
    Logger.debug("Open the local repository… (from " + candidatePath + ")");
    var s_repository = Bacon.fromNodeCallback(
      _.partial(fs.stat, path.join(candidatePath, ".git"))
    ).flatMapLatest(function(stats) {
      if(stats.isDirectory()) {
        return Bacon.fromPromise(nodegit.Repository.open(path.join(candidatePath, ".git")));
      } else {
        return new Bacon.Error("No repository found in " + candidatePath);
      }
    });

    return s_repository.flatMapError(function(error) {
      Logger.info("Cannot open repository in " + candidatePath + " (error: " + error + ")");
      if(path.parse(candidatePath).root == candidatePath) {
        return new Bacon.Error("No repository found");
      } else {
        return Git.getRepository(path.normalize(path.join(candidatePath, "..")));
      }
    }).toProperty();
  };

  Git.getRemoteName = function(remote) {
    if(remote.name()) return remote.name();
    else return remote.url();
  };

  Git.getRemote = function(name) {
    return Git.getRepository().flatMapLatest(function(repository) {
      Logger.debug("Loading the \"" + name + "\" remote…");
      return Bacon.fromPromise(nodegit.Remote.lookup(repository, name));
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
        Logger.debug("Created remote " + name);
        return Bacon.fromPromise(nodegit.Remote.create(repository, name, url));
      }).flatMapLatest(function(){
        return Git.getRemote(name);
      });
    });

    var s_newAnonRemote = s_existingValidRemote.errors().flatMapError(() => {
      Logger.warn(`The current ${name} does not point to the right URL, using a temporary one`);
      return Git.getRepository().flatMapLatest(repo => {
        return Bacon.fromPromise(nodegit.Remote.createAnonymous(repo, url));
      });
    });

    return Bacon.mergeAll(s_existingValidRemote.skipErrors(), s_newRemote, s_newAnonRemote);
  };

  Git.fetch = function(remote) {
    Logger.debug("Fetching " + Git.getRemoteName(remote) + "…");
    return conf.loadOAuthConf().flatMapLatest(function(tokens) {
      return Bacon.fromPromise(
        remote.fetch([Git.getRemoteName(remote)], Git.fetchOptions(tokens.token, tokens.secret))
      ).map(remote);
    });
  };

  Git.keepFetching = function(timeout, remote) {
    var s_timeout = timeout > 0 ? Bacon.later(timeout, {}) : Bacon.never();
    var fetch = function() {
      Logger.debug("Fetching " + Git.getRemoteName(remote));
      return conf.loadOAuthConf().flatMapLatest(function(tokens) {
        return Bacon.fromPromise(
          remote.fetch(["refs/heads/master"], Git.fetchOptions(tokens.token, tokens.secret))
        ).map(remote).flatMapError(function(error) {
          return (error.message != "Early EOF") ? new Bacon.Error(error) : Bacon.later(10000, {}).flatMapLatest(function() {
            return fetch();
          });
        });
      });
    };

    Logger.debug("Wait for " + Git.getRemoteName(remote) + " to be fetchable…");
    var s_fetch = fetch().takeUntil(s_timeout).doAction(function() {
      Logger.debug("Fetched " + Git.getRemoteName(remote));
    });

    return s_fetch;
  };

  Git.getRemoteCommitId = function(remoteName) {
    return Git.getRepository().flatMapLatest(function(repo) {
      return Bacon.fromPromise(repo.getReferenceCommit(remoteName + '/master'))
            .map(function(commit) {
              return commit.id().toString();
            })
            .mapError(function(e) {
              return null;
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

  Git.push = function(remote, branch, s_commitId, force) {
    Logger.debug("Prepare the push…");

    var forcePush = force ? '+' : '';
    var s_current_branch = Git.getCurrentBranch();
    var s_branch = branch == "" ? s_current_branch : Git.getBranch(branch);

    return s_branch.flatMapLatest(function(branch) {
      return s_commitId.flatMapLatest(function(commitIdToPush) {
        return Git.getRemoteCommitId(Git.getRemoteName(remote)).flatMapLatest(function(remoteCommitId) {
          if(remoteCommitId != commitIdToPush) {
            Logger.debug("Preparing the push");
            return conf.loadOAuthConf().flatMapLatest(function(tokens) {
              return Bacon.fromPromise(
                remote.push([forcePush + branch + ":refs/heads/master"], Git.pushOptions(tokens.token, tokens.secret))
              );
            });
          } else {
            return new Bacon.Error("Nothing to push");
          }
        });
      });
    });
  };

  return Git;
};

var fs = require("fs");
var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");
var expect = require('chai').expect;

var shell = require("shelljs");
var exec = shell.exec;
var rm = shell.rm;

var repo = "https://github.com/CleverCloud/empty-repo";
var repoPath = __dirname + "/empty-repo";

if(fs.existsSync(repoPath)) {
  rm("-rf", repoPath);
};

if(exec("cd " + __dirname + " && git clone " + repo + " " + path.resolve(repoPath)).code != 0) {
  console.error("Cannot clone test repository: " + repo);
  exit(1);
}

describe("git", function() {
  var git = require("../src/models/git.js")(repoPath);

  it("should be able to get the current repository", function(done) {
    git.getRepository().subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      expect(path.resolve(event.value().path())).to.equal(path.resolve(repoPath, ".git"));
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to get the \"origin\" remote", function(done) {
    git.getRemote("origin").subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      expect(event.value().url()).to.equal(repo);
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to get the \"master\" branch", function(done) {
    git.getBranch("master").subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      expect(event.value().name()).to.equal("refs/heads/master");
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to create a \"origin2\" remote", function(done) {
    git.createRemote("origin2", repo).subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      expect(event.value().url()).to.equal(repo);
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to fetch a remote", function(done) {
    git.getRemote("origin").flatMapLatest(git.fetch).subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      expect(event.value().url()).to.equal(repo);
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to keep fetching a remote", function(done) {
    git.getRemote("origin").flatMapLatest(_.partial(git.keepFetching, 30000)).subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      expect(event.value().url()).to.equal(repo);
      done();

      return Bacon.noMore;
    });
  });

  it("should not push to the origin remote if the remote is up-to-date", function(done) {
    var s_push = git.getRemote("origin").flatMapLatest(function(remote) {
      return git.push(remote, "master", git.getCommitId("master"), false);
    });

    s_push.subscribe(function(event) {
      expect(event.hasValue()).to.equal(false);
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to lookup a full commit id", function(done) {
    git.resolveFullCommitId('e9e2').subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      expect(event.value()).to.equal('e9e2437e73d8f10985ef8c5fd869ba9988019d80');
      done();
      return Bacon.noMore;
    });
  });

  it.skip("should push to the origin remote", function(done) {
    var s_push = git.getRemote("origin").flatMapLatest(function(remote) {
      return git.push(remote, "master", Bacon.once("0000000000000000000000000000000000000000"), false);
    });

    s_push.subscribe(function(event) {
      expect(event.hasValue()).to.equal(true);
      done();

      return Bacon.noMore;
    });
  });
});

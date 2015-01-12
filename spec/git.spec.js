var fs = require("fs");
var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var shell = require("shelljs");
var exec = shell.exec;
var rm = shell.rm;

var repo = "git@gitlab.clever-cloud.com:rbelouin/empty-repo.git";
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
      expect(event.hasValue()).toBe(true);
      expect(path.resolve(event.value().path())).toBe(path.resolve(repoPath, ".git"));
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to get the \"origin\" remote", function(done) {
    git.getRemote("origin").subscribe(function(event) {
      expect(event.hasValue()).toBe(true);
      expect(event.value().url()).toBe(repo);
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to get the \"master\" branch", function(done) {
    git.getBranch("master").subscribe(function(event) {
      expect(event.hasValue()).toBe(true);
      expect(event.value().name()).toBe("refs/heads/master");
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to create a \"origin2\" remote", function(done) {
    git.createRemote("origin2", repo).subscribe(function(event) {
      expect(event.hasValue()).toBe(true);
      expect(event.value().url()).toBe(repo);
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to fetch a remote", function(done) {
    git.getRemote("origin").flatMapLatest(git.fetch).subscribe(function(event) {
      expect(event.hasValue()).toBe(true);
      expect(event.value().url()).toBe(repo);
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to keep fetching a remote", function(done) {
    git.getRemote("origin").flatMapLatest(_.partial(git.keepFetching, 30000)).subscribe(function(event) {
      expect(event.hasValue()).toBe(true);
      expect(event.value().url()).toBe(repo);
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to push to the origin remote", function(done) {
    git.getRemote("origin").flatMapLatest(_.partialRight(git.push, "master")).subscribe(function(event) {
      expect(event.hasValue()).toBe(true);
      done();

      return Bacon.noMore;
    });
  });
});

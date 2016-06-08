var parseLine = require("../src/models/env.js").parseEnvLine;
var expect = require('chai').expect;

describe("env", function() {
  it("correctly parse a correct line", function() {
    var line = "KEY=value";
    expect(parseLine(line)).to.deep.equal(["KEY", "value"]);
  });

  it("correctly parse a line where values contains =", function() {
    var line = "KEY=value==";
    expect(parseLine(line)).to.deep.equal(["KEY", "value=="]);
  });

  it("ignore lines starting with #", function() {
    var line  = "#KEY=value";
    var line2 = "  #KEY=value";
    expect(parseLine(line)).to.be.a('null');
    expect(parseLine(line2)).to.be.a('null');
  });

  it("ignore empty lines", function() {
    var line  = "";
    expect(parseLine(line)).to.be.a('null');
  });
});

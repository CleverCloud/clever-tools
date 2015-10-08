var parseLine = require("../src/models/env.js").parseEnvLine;
describe("env", function() {
  it("correctly parse a correct line", function() {
    var line = "KEY=value";
    expect(parseLine(line)).toEqual(["KEY", "value"]);
  });

  it("correctly parse a line where values contains =", function() {
    var line = "KEY=value==";
    expect(parseLine(line)).toEqual(["KEY", "value=="]);
  });

  it("ignore lines starting with #", function() {
    var line  = "#KEY=value";
    var line2 = "  #KEY=value";
    expect(parseLine(line)).toEqual(null);
    expect(parseLine(line2)).toEqual(null);
  });

  it("ignore empty lines", function() {
    var line  = "";
    expect(parseLine(line)).toEqual(null);
  });
});

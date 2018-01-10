'use strict'

const _ = require('lodash');
const expect = require('chai').expect;
const slugify = require('../src/models/app_configuration').slugify

describe("app_configuration", function() {
  it("should slugify strings (with transliteration)", function () {
    expect(slugify("Foo   BAR_baz")).to.equal("foo-bar-baz");
    expect(slugify("[Hello] (World)!")).to.equal("hello-world");
    expect(slugify("éàèçœ")).to.equal("eaecoe");
    expect(slugify("ありがとう")).to.equal("arigatou");
    expect(slugify("привет")).to.equal("priviet");
  })
});

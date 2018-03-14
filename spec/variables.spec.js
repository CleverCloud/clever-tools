'use strict';

const expect = require('chai').expect;

const { parseLine } = require('../src/models/variables.js');

describe('env', function () {

  it('correctly parse a correct line', () => {
    const line = 'KEY=value';
    expect(parseLine(line)).to.deep.equal(['KEY', 'value']);
  });

  it('correctly parse a line where values contains =', () => {
    const line = 'KEY=value==';
    expect(parseLine(line)).to.deep.equal(['KEY', 'value==']);
  });

  it('ignore lines starting with #', () => {
    const line = '#KEY=value';
    const line2 = '  #KEY=value';
    expect(parseLine(line)).to.be.a('null');
    expect(parseLine(line2)).to.be.a('null');
  });

  it('ignore empty lines', () => {
    const line = '';
    expect(parseLine(line)).to.be.a('null');
  });
});

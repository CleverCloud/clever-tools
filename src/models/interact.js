'use strict';

const readline = require('readline');

const _ = require('lodash');
const Bacon = require('baconjs');

function ask (question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return Bacon
    .fromCallback(rl.question.bind(rl, question))
    .doAction(rl.close.bind(rl));
}

function confirm (question, rejectionMessage, expectedAnswers = ['yes', 'y']) {
  return ask(question).flatMapLatest((answer) => {
    if (_.includes(expectedAnswers, answer)) {
      return true;
    }
    return new Bacon.Error(rejectionMessage);
  });
}

module.exports = { ask, confirm };

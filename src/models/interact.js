'use strict';

const readline = require('readline');

function ask (question) {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function confirm (question, rejectionMessage, expectedAnswers = ['yes', 'y']) {
  const answer = await ask(question);
  if (!expectedAnswers.includes(answer)) {
    throw new Error(rejectionMessage);
  }
  return true;
}

module.exports = { confirm };

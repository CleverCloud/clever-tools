const Logger = require('../logger.js');
const colors = require('colors/safe.js');

const FEEDBACK_URL = `https://go.clever-cloud.com/feedback`;
const ALPHA_MESSAGE = `️😉 Hey, you found an alpha feature, please give us your feedback at ${FEEDBACK_URL}`;

function displayAlphaBanner () {
  Logger.println(colors.yellow(ALPHA_MESSAGE));
}

module.exports = {
  displayAlphaBanner,
};

'use strict';

const colors = require('colors/safe');

const Logger = require('../logger.js');
const User = require('../models/user.js');

async function profile () {
  const { name, email, preferredMFA } = await User.getCurrent();
  const has2FA = (preferredMFA != null && preferredMFA !== 'NONE') ? 'yes' : 'no';
  const formattedName = name || colors.red.bold('[not specified]');
  Logger.println('You\'re currently logged in as:');
  Logger.println('Name:           ', formattedName);
  Logger.println('Email:          ', email);
  Logger.println('Two factor auth:', has2FA);
};

module.exports = { profile };

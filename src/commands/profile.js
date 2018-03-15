'use strict';

const handleCommandStream = require('../command-stream-handler');
const Logger = require('../logger.js');
const User = require('../models/user.js');

function profile (api) {

  const s_currentUser = User.getCurrent(api)
    .map(({ name, email, preferredMFA }) => {
      const has2FA = (preferredMFA != null && preferredMFA !== 'NONE') ? 'yes' : 'no';
      Logger.println('You\'re currently logged in as:');
      Logger.println('Name:           ', name);
      Logger.println('Email:          ', email);
      Logger.println('Two factor auth:', has2FA);
    });

  handleCommandStream(s_currentUser);
};

module.exports = profile;

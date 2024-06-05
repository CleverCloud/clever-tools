'use strict';

const colors = require('colors/safe');

const Logger = require('../logger.js');
const User = require('../models/user.js');

async function profile (params) {
  const { 'list-emails': listEmails, 'add-email': emailToAdd, 'remove-email': emailToRemove, 'primary-email': emailToPrimary } = params.options;
  const { id, name, email, preferredMFA } = await User.getCurrent();

  if (listEmails) {
    showEmails(email);
    return;
  }

  if (!listEmails && !emailToAdd && !emailToRemove && !emailToPrimary) {
    showProfile(id, name, email, preferredMFA);
    return;
  }

  if (emailToAdd === emailToRemove && emailToAdd ) {
    Logger.error('Email to add and to remove can\'t be the same');
    return;
  }

  if (emailToPrimary === emailToRemove && emailToPrimary) {
    Logger.error('You can\'t remove the primary email');
    return;
  }

  if (emailToPrimary === email) {
    Logger.error('This email is already the primary email');
    return;
  }

  if (emailToAdd) {
    const result = await User.addEmail(emailToAdd);
    Logger.println(result.message);
  }

  if (emailToPrimary) {
    const result = await User.addPrimaryEmail(emailToPrimary);
    Logger.println(result.message);
  }

  if (emailToRemove) {
    const result = await User.removeEmail(emailToRemove);
    Logger.println(result.message);
  }
};

async function showProfile (id, name, email, preferredMFA) {
  const has2FA = (preferredMFA != null && preferredMFA !== 'NONE') ? 'yes' : 'no';
  const formattedName = name || colors.red.bold('[not specified]');
  Logger.println('You\'re currently logged in as:');
  Logger.println('User id          ' + id);
  Logger.println('Name             ' + formattedName);
  Logger.println('Email            ' + email);
  Logger.println('Two factor auth  ' + has2FA);
}

async function showEmails (email) {
  Logger.println('Primary email:');
    console.log(`- ${email}`);

    const secondaryEmails = await User.getEmails();

    if (secondaryEmails.length === 0) return;

    Logger.println();

    if (secondaryEmails.length === 1) {
      Logger.println('Secondary email:');
    }
    else {
      Logger.println('Secondary emails:');
    }

    secondaryEmails.sort().map(e => console.log(`- ${e}`));
}

module.exports = { profile };

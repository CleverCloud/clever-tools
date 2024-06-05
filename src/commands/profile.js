'use strict';

const colors = require('colors/safe');
const openPage = require('open');

const Logger = require('../logger.js');
const User = require('../models/user.js');

async function profile (params) {
  const currentUser = await User.getCurrent();
  const { id, name, email, preferredMFA } = currentUser;
  const { format, 'list-emails': listEmails, 'add-email': emailToAdd, 'remove-email': emailToRemove, 'primary-email': emailToPrimary, 'list-keys': listKeys } = params.options;

  if (listEmails) {
    showEmails(email, format);
    return;
  }

  if (listKeys) {
    showKeys(format);
    return;
  }

  if (!listEmails && !emailToAdd && !emailToRemove && !emailToPrimary) {
    showProfile(currentUser, format);
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

async function showProfile (user, format) {
  const { id, name, email, preferredMFA } = user;
  const formattedName = name || colors.red.bold('[not specified]');
  const has2FA = (preferredMFA != null && preferredMFA !== 'NONE') ? 'yes' : 'no';

  switch (format) {
    case 'json':
      Logger.printJson(user);
      break;
    case 'human':
    default:
      Logger.println(`ID: ${id}`);
      Logger.println(`Name: ${formattedName}`);
      Logger.println(`Email: ${email}`);
      Logger.println(`2FA enabled: ${has2FA}`);
  }
}

async function showEmails (email, format) {
  const secondaryEmails = await User.getEmails();
  const sorted = secondaryEmails.sort();

  if (format === 'json') {
    Logger.printJson({ primary: email, secondary: sorted });
    return;
  }

  Logger.println('Primary email:');
    console.log(`- ${email}`);

    if (secondaryEmails.length === 0) return;

    Logger.println();

    if (secondaryEmails.length === 1) {
      Logger.println('Secondary email:');
    }
    else {
      Logger.println('Secondary emails:');
    }

    sorted.map(e => console.log(`- ${e}`));
}

async function showKeys (format) {
  const keys = await User.getKeys();
  const sorted = keys.sort((a, b) => a.name.localeCompare(b.name));

  if (format === 'json') {
    Logger.printJson(sorted);
    return;
  }

  if (keys.length === 0) {
    Logger.println('No SSH keys');
    return;
  }

  if (keys.length === 1) {
    Logger.println('SSH key:');
  }
  else {
    Logger.println('SSH keys:');
  }

  sorted.map(k => {
    console.log(`- ${k.name} (${k.fingerprint})`);
    console.log(`  ${k.key}`);
  });

}

async function open () {
  const url = 'https://console.clever-cloud.com/users/me/information';
  Logger.println('Opening your profile in your browser');
  await openPage(url, { wait: false });
}

module.exports = { open, profile };

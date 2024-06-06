'use strict';

const colors = require('colors/safe');
const openPage = require('open');

const Interact = require('../models/interact.js');
const Logger = require('../logger.js');
const User = require('../models/user.js');
const { readStdin } = require('../models/variables.js');

async function profile (params) {
  const currentUser = await User.getCurrent();
  const { email } = currentUser;
  const { format, emails: listEmails, 'email-add': emailToAdd, 'email-remove': emailToRemove, 'email-primary': emailToPrimary, 'emails-remove-all': clearEmails, keys: listKeys, 'key-add': keyToAdd, 'key-remove': keyToRemove, 'keys-remove-all': clearKeys } = params.options;

  if (listEmails) {
    await showEmails(email, format);
    return;
  }

  if (listKeys) {
    await showKeys(format);
    return;
  }

  if (clearKeys) {
    await deleteKeys();
    return;
  }

  if (clearEmails) {
    await deleteEmails();
    return;
  }

  if (!emailToAdd && !emailToRemove && !emailToPrimary && !keyToAdd && !keyToRemove) {
    await showProfile(currentUser, format);
    return;
  }

  if (emailToAdd === emailToRemove && emailToAdd) {
    Logger.error('Email to add and to remove can\'t be the same');
    return;
  }

  if (keyToAdd === keyToRemove && keyToAdd) {
    Logger.error('Key to add and to remove can\'t be the same');
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

  if (keyToAdd) {
    const rawStdin = await readStdin();
    Logger.debug(`stdin content: ${rawStdin}`);

    const result = await User.addKey(keyToAdd, rawStdin);
    Logger.println(result.message);
  }

  if (keyToRemove) {
    const result = await User.removeKey(keyToRemove);
    Logger.println(result.message);
  }
};

async function deleteEmails () {
  const emails = await User.getEmails();
  if (emails.length === 0) {
    Logger.println('No secondary emails to remove');
    return;
  }

  await Interact.confirm('Are you sure you want to remove all your secondary emails? (y/n) ', 'No secondary emails removed');
  const promises = emails.map((e) => User.removeEmail(e));
  await Promise.all(promises);
  Logger.println('All secondary emails removed');
}

async function deleteKeys () {
  const keys = await User.getKeys();
  if (keys.length === 0) {
    Logger.println('No SSH keys to remove');
    return;
  }

  await Interact.confirm('Are you sure you want to remove all your SSH keys? (y/n) ', 'No SSH keys removed');
  const promises = keys.map((k) => User.removeKey(k.name));
  await Promise.all(promises);
  Logger.println('All SSH keys removed');
}

async function open () {
  const url = 'https://console.clever-cloud.com/users/me/information';
  Logger.println('Opening your profile in your browser');
  await openPage(url, { wait: false });
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

  sorted.forEach((e) => console.log(`- ${e}`));
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

  sorted.forEach((k) => {
    console.log(`- ${k.name} (${k.fingerprint})`);
  });
}

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

module.exports = { open, profile };

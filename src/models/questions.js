'use strict';

const Parsers = require('../parsers.js');

const ngLabel = {
  type: 'text',
  name: 'ngLabel',
  message: 'Networkgroup label (also used for DNS context)',
  // FIXME: Add real validation
  validate: (value) => value.length > 0,
};

const ngDescription = {
  type: 'text',
  name: 'ngDescription',
  message: 'Networkgroup description',
  // FIXME: Add real validation
  validate: (value) => true,
};

const ngTags = {
  type: 'list',
  name: 'ngTags',
  message: 'Networkgroup tags separated by commas (Ctrl+C or Esc to skip)',
  initial: '',
  separator: ',',
};

const ngMemberLabel = {
  type: 'text',
  name: 'ngMemberLabel',
  message: 'How do you want to call it (label)?',
  // FIXME: Add real validation
  validate: (value) => true,
};

const ngMemberDomainName = {
  type: 'text',
  name: 'ngMemberDomainName',
  message: 'What domain name do you want it to have?',
  // FIXME: Add real validation
  validate: (value) => true,
};

function ngNodeCategory (members) {
  return {
    type: 'autocomplete',
    name: 'ngNodeCategory',
    message: 'What category do you want to join?',
    choices: [
      ...members.map((m) => ({ title: m.label, value: m.id })),
      { title: 'Create new category', value: 'new' },
    ],
    initial: 0,
  };
}

const ngServerIp = {
  type: 'text',
  name: 'ngServerIp',
  message: 'Your server peer IP address:',
  validate: (value) => String(value).match(Parsers.ipAddressRegex),
};

const ngServerPort = {
  type: 'number',
  name: 'ngServerPort',
  message: 'Your server peer port:',
  validate: (value) => String(value).match(Parsers.portNumberRegex),
};

const ngQuestions = {
  ngLabel,
  ngDescription,
  ngTags,
  ngMemberLabel,
  ngMemberDomainName,
  ngNodeCategory,
  ngServerIp,
  ngServerPort,
};

module.exports = {
  ngQuestions,
};

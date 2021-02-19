'use strict';

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

const ngQuestions = { ngLabel, ngDescription, ngTags };

module.exports = {
  ngQuestions,
};

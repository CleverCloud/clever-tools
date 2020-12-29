'use strict';

const ngLabelQuestion = {
  type: 'text',
  name: 'ngLabel',
  message: 'Networkgroup label (also used for DNS context)',
  validate: (value) => value.length > 0,
};

const ngDescriptionQuestion = {
  type: 'text',
  name: 'ngDescription',
  message: 'Networkgroup description',
  validate: (value) => value.length > 100,
};

const ngTagsQuestion = {
  type: 'list',
  name: 'ngTags',
  message: 'Networkgroup tags separated by commas (Ctrl+C or Esc to skip)',
  initial: '',
  separator: ',',
};

const ngQuestions = {
  label: ngLabelQuestion,
  description: ngDescriptionQuestion,
  tags: ngTagsQuestion,
};

module.exports = {
  ngQuestions,
  ngLabelQuestion,
  ngDescriptionQuestion,
  ngTagsQuestion,
};

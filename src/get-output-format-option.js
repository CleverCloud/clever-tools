const cliparse = require('cliparse');

function getOutputFormatOption (formats = []) {
  const availableFormats = ['human', 'json', ...formats];
  return cliparse.option('format', {
    aliases: ['F'],
    metavar: 'format',
    parser: (format) => {
      return availableFormats.includes(format)
        ? cliparse.parsers.success(format)
        : cliparse.parsers.error('The output format must be one of ' + availableFormats.join(', '));
    },
    default: 'human',
    description: `Output format (${availableFormats.join(', ')})`,
    complete () {
      return cliparse.autocomplete.words(availableFormats);
    },
  });
}

module.exports = {
  getOutputFormatOption,
};

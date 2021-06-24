module.exports = {
  'extends': 'standard',
  'rules': {
    'arrow-parens': ['error', 'always'],
    'brace-style': ['error', 'stroustrup'],
    'comma-dangle': ['error', 'always-multiline'],
    'line-comment-position': ['error', { 'position': 'above' }],
    'padded-blocks': 'off',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    // disabled for now
    'camelcase': 'off',
    'operator-linebreak': ['error', 'before'],
    'curly': ['error', 'all'],
    'eqeqeq': ['error', 'always', { 'null': 'never' }],
  },
};

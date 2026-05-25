const expoConfig = require('eslint-config-expo/flat');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  ...expoConfig,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'warn',
      'import/no-unresolved': ['error', { ignore: ['^@expo/', '^expo-'] }],
    },
  },
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'coverage/',
      'android/',
      'ios/',
      '.eslintrc.cjs',
      '.eslintrc.a11y.cjs',
      'scripts/',
    ],
  },
];

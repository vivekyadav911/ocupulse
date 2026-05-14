/* eslint-env node */
module.exports = {
  root: true,
  extends: ['plugin:react-native-a11y/all'],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  settings: {
    'react-native-a11y': {
      components: {
        TouchableOpacity: 'TouchableOpacity',
        Pressable: 'Pressable',
        Button: 'Button',
      },
    },
  },
};

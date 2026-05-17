module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo already adds react-native-reanimated/plugin last when the package is installed.
  // A second copy here can break plugin order and leave expo-router transforms incomplete.
  return {
    presets: ['babel-preset-expo'],
  };
};

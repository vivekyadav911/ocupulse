module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Required for Expo web: transforms import.meta (e.g. zustand, expo-router deps).
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: isTest ? [] : ['react-native-reanimated/plugin'],
  };
};

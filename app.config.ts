import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => ({
  name: 'STEMM Lab',
  slug: 'stemm-lab',
  scheme: 'stemmlab',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0B1F3A',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.ocupulse.stemmlab',
    requireFullScreen: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0B1F3A',
    },
    package: 'com.ocupulse.stemmlab',
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'STEMM Lab uses your location to place sound samples and show your suburb on the map.',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#FFB400',
      },
    ],
  ],
  extra: {
    router: { origin: false },
    firebaseApiKey: process.env.FIREBASE_API_KEY ?? '',
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? '',
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? '',
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
    firebaseAppId: process.env.FIREBASE_APP_ID ?? '',
    admobAndroidBannerUnitId:
      process.env.ADMOB_ANDROID_BANNER_UNIT_ID ?? 'ca-app-pub-3940256099942544/6300978111',
    admobAndroidInterstitialUnitId:
      process.env.ADMOB_ANDROID_INTERSTITIAL_UNIT_ID ?? 'ca-app-pub-3940256099942544/1033173712',
  },
  experiments: {
    typedRoutes: true,
  },
});

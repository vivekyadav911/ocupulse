import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

function firebaseEnv(name: string): string {
  return process.env[`EXPO_PUBLIC_FIREBASE_${name}`] ?? process.env[`FIREBASE_${name}`] ?? '';
}

export default (): ExpoConfig => ({
  name: 'Ocupulse',
  slug: 'ocupulse',
  scheme: 'ocupulse',
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
    infoPlist: {
      UIBackgroundModes: ['fetch'],
    },
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
      'expo-camera',
      {
        cameraPermission:
          'Ocupulse uses the camera for parachute slow-motion and hand-fan tracking experiments.',
        microphonePermission:
          'Ocupulse uses the microphone for Sound Pollution Hunter ambient sampling and audio with video clips during camera experiments.',
        recordAudioAndroid: true,
      },
    ],
    [
      'expo-av',
      {
        microphonePermission:
          'Ocupulse uses the microphone for Sound Pollution Hunter and the mic capability spike.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Ocupulse uses your location to place sound samples and show your suburb on the map.',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#FFB400',
      },
    ],
    'expo-background-fetch',
    'expo-task-manager',
    'expo-video',
  ],
  extra: {
    eas: {
      projectId: '0911f931-1fe2-4c03-80bf-f26c82d7a60c',
    },
    router: { origin: false },
    firebaseApiKey: firebaseEnv('API_KEY'),
    firebaseAuthDomain: firebaseEnv('AUTH_DOMAIN'),
    firebaseProjectId: firebaseEnv('PROJECT_ID'),
    firebaseStorageBucket: firebaseEnv('STORAGE_BUCKET'),
    firebaseMessagingSenderId: firebaseEnv('MESSAGING_SENDER_ID'),
    firebaseAppId: firebaseEnv('APP_ID'),
    admobAndroidBannerUnitId:
      process.env.ADMOB_ANDROID_BANNER_UNIT_ID ?? 'ca-app-pub-3940256099942544/6300978111',
    admobAndroidInterstitialUnitId:
      process.env.ADMOB_ANDROID_INTERSTITIAL_UNIT_ID ?? 'ca-app-pub-3940256099942544/1033173712',
  },
  experiments: {
    typedRoutes: true,
  },
});

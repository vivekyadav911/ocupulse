import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

function firebaseEnv(name: string): string {
  return process.env[`EXPO_PUBLIC_FIREBASE_${name}`] ?? process.env[`FIREBASE_${name}`] ?? '';
}

/** Google sample app IDs — safe for dev/Test Lab; override via ADMOB_*_APP_ID in .env for release. */
const ADMOB_ANDROID_APP_ID =
  process.env.ADMOB_ANDROID_APP_ID?.trim() || 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_IOS_APP_ID =
  process.env.ADMOB_IOS_APP_ID?.trim() || 'ca-app-pub-3940256099942544~1458002511';

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
      ITSAppUsesNonExemptEncryption: false,
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
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: ADMOB_ANDROID_APP_ID,
        iosAppId: ADMOB_IOS_APP_ID,
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '5ff36b32-319c-4e1f-9431-ebe2739a1d29',
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

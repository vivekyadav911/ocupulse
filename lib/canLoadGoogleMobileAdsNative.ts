import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * `react-native-google-mobile-ads` needs a dev client / production binary.
 * Requiring it in Expo Go throws (TurboModule RNGoogleMobileAdsModule missing).
 */
export function canLoadGoogleMobileAdsNativeModule(): boolean {
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

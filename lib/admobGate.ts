import { useSessionStore } from '../store/sessionStore';

/** Kid-safe gate: interstitial only for high-school cohorts (Assessment ethics + rubric). */
export function shouldShowInterstitialAd(): boolean {
  return useSessionStore.getState().showAdsInterstitial();
}

/** No-op in Expo Go; loads Google's test interstitial in dev client when allowed. */
export async function showResultsInterstitialIfAllowed(): Promise<void> {
  if (!shouldShowInterstitialAd()) return;
  /* eslint-disable @typescript-eslint/no-require-imports -- optional native module */
  try {
    const ads =
      require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
    const interstitial = ads.InterstitialAd.createForAdRequest(ads.TestIds.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitial.addAdEventListener(ads.AdEventType.LOADED, () => {
      void interstitial.show();
    });
    interstitial.load();
  } catch {
    /* native module missing */
  }
  /* eslint-enable @typescript-eslint/no-require-imports */
}

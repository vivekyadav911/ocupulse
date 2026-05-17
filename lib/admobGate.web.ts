/** Web: no AdMob native module. */
export function shouldShowInterstitialAd(): boolean {
  return false;
}

export async function showResultsInterstitialIfAllowed(): Promise<void> {
  /* no-op on web */
}

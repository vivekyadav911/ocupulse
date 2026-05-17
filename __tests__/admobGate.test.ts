import { shouldShowInterstitialAd } from '../lib/admobGate';
import { useSessionStore } from '../store/sessionStore';

describe('AdMob kid-safe gate', () => {
  afterEach(() => {
    useSessionStore.getState().setTeam({ gradeLevel: 'Year 6' });
  });

  it('disables interstitial for Year 4', () => {
    useSessionStore.getState().setTeam({ gradeLevel: 'Year 4' });
    expect(shouldShowInterstitialAd()).toBe(false);
  });

  it('enables interstitial for Year 9', () => {
    useSessionStore.getState().setTeam({ gradeLevel: 'Year 9' });
    expect(shouldShowInterstitialAd()).toBe(true);
  });
});

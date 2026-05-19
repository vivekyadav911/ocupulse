import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

import { canLoadGoogleMobileAdsNativeModule } from '../lib/canLoadGoogleMobileAdsNative';

type AdsMod = typeof import('react-native-google-mobile-ads');

export function StemmBannerAd(): ReactNode {
  const unitId = String(Constants.expoConfig?.extra?.admobAndroidBannerUnitId ?? '');
  const [Ads, setAds] = useState<AdsMod | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canLoadGoogleMobileAdsNativeModule()) {
      setAds(null);
      return;
    }
    try {
      // Dev client / EAS binary only; require() still throws if module not linked.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const m = require('react-native-google-mobile-ads') as AdsMod;
      setAds(m);
      void m
        .MobileAds()
        .initialize()
        .then(() => setReady(true))
        .catch(() => setReady(false));
    } catch {
      setAds(null);
    }
  }, []);

  if (!Ads || !ready || !unitId) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.muted}>Banner ad (run dev client / EAS build)</Text>
      </View>
    );
  }
  const { BannerAd, BannerAdSize } = Ads;
  return <BannerAd unitId={unitId} size={BannerAdSize.BANNER} />;
}

const styles = StyleSheet.create({
  fallback: { padding: 8, alignItems: 'center' },
  muted: { fontSize: 12, opacity: 0.6 },
});

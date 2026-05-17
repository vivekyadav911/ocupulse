import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/** Web: AdMob native module is unavailable; show a lightweight placeholder. */
export function StemmBannerAd(): ReactNode {
  return (
    <View style={styles.fallback}>
      <Text style={styles.muted}>Ads are disabled on web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { padding: 8, alignItems: 'center' },
  muted: { fontSize: 12, opacity: 0.6 },
});

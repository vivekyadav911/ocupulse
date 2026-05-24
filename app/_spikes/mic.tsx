import { Audio } from 'expo-av';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '../../components/Button';
import { useMicrophoneDb } from '../../hooks/useMicrophoneDb';
import { showAlert } from '../../lib/alert';
import { colors, spacing } from '../../theme/tokens';

export default function MicSpike() {
  const mic = useMicrophoneDb();
  const [perm, setPerm] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const refreshPerm = useCallback(async () => {
    const { status, canAskAgain } = await Audio.getPermissionsAsync();
    if (status === 'granted') setPerm('granted');
    else if (!canAskAgain && status !== 'undetermined') setPerm('denied');
    else setPerm('unknown');
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshPerm();
    }, [refreshPerm]),
  );

  const requestPerm = async () => {
    const { status, canAskAgain } = await Audio.requestPermissionsAsync();
    if (status === 'granted') {
      setPerm('granted');
      showAlert('Microphone ready', 'Tap Start to measure dB levels.');
      return;
    }
    setPerm(canAskAgain ? 'unknown' : 'denied');
    showAlert(
      canAskAgain ? 'Permission needed' : 'Microphone blocked',
      canAskAgain
        ? 'Allow microphone access when iOS prompts you.'
        : 'Open Settings → Ocupulse → enable Microphone, then return here.',
    );
  };

  const onStart = async () => {
    let { status, canAskAgain } = await Audio.getPermissionsAsync();
    if (status !== 'granted') {
      const requested = await Audio.requestPermissionsAsync();
      status = requested.status;
      canAskAgain = requested.canAskAgain;
      if (status !== 'granted') {
        setPerm(canAskAgain ? 'unknown' : 'denied');
        showAlert(
          canAskAgain ? 'Permission needed' : 'Microphone blocked',
          canAskAgain
            ? 'Allow microphone access when prompted.'
            : 'Open Settings → Ocupulse → enable Microphone.',
        );
        return;
      }
      setPerm('granted');
    }
    const ok = await mic.start();
    if (!ok && mic.permissionDenied) {
      showAlert('Microphone blocked', 'Enable microphone in Settings for Ocupulse.');
    } else if (!ok && mic.sessionError) {
      showAlert('Could not start', mic.sessionError);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.big}>{mic.liveDb != null ? `${Math.round(mic.liveDb)}` : '—'} dB</Text>
      <Text style={styles.meta}>
        Peak {mic.peakDb != null ? Math.round(mic.peakDb) : '—'} · Avg{' '}
        {mic.avgDb != null ? Math.round(mic.avgDb) : '—'}
      </Text>
      <Text style={styles.meta}>
        Permission: {perm === 'granted' ? '✓' : perm === 'denied' ? 'blocked — open Settings' : '—'}
      </Text>
      {perm === 'denied' ? (
        <Pressable onPress={() => void Linking.openSettings()} accessibilityRole="link">
          <Text style={styles.link}>Open system Settings</Text>
        </Pressable>
      ) : null}
      {mic.sessionError ? <Text style={styles.err}>{mic.sessionError}</Text> : null}
      <Button title="Request microphone" variant="accent" onPress={() => void requestPerm()} />
      <Button title="Start" onPress={() => void onStart()} disabled={mic.recording} />
      <Button
        title="Stop"
        variant="secondary"
        onPress={() => void mic.stop()}
        disabled={!mic.recording}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  big: { fontSize: 32, fontWeight: '800', color: colors.primary, marginBottom: spacing.sm },
  meta: { color: colors.muted, marginBottom: spacing.sm },
  link: { color: colors.accent, fontWeight: '700', marginBottom: spacing.md },
  err: { color: colors.danger, marginBottom: spacing.sm },
});

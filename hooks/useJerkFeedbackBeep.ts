import { Audio } from 'expo-av';
import { useEffect, useRef } from 'react';

const BEEP_DEBOUNCE_MS = 150;

type UseJerkFeedbackBeepOptions = {
  enabled: boolean;
  liveJerkMm: number;
  thresholdMm: number;
};

export function useJerkFeedbackBeep({
  enabled,
  liveJerkMm,
  thresholdMm,
}: UseJerkFeedbackBeepOptions) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const lastBeepRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
        const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/jerk-beep.wav'), {
          volume: 0.35,
          shouldPlay: false,
        });
        if (mounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch {
        // Asset or audio init may fail on web/simulator — feedback is optional.
      }
    })();

    return () => {
      mounted = false;
      void soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || liveJerkMm <= thresholdMm) return;
    const now = Date.now();
    if (now - lastBeepRef.current < BEEP_DEBOUNCE_MS) return;
    lastBeepRef.current = now;

    const sound = soundRef.current;
    if (!sound) return;

    void (async () => {
      try {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch {
        // Ignore playback errors during rapid feedback.
      }
    })();
  }, [enabled, liveJerkMm, thresholdMm]);
}

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { FormField } from '../../components/FormField';
import { StatReadout } from '../../components/StatReadout';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { gForceNoBounce } from '../../lib/calc/gforce';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

export default function ParachuteScreen() {
  const router = useRouter();
  const { magnitude } = useAccelerometer();
  const team = useSessionStore((s) => s.teamName);
  const [impact, setImpact] = useState('2.0');
  const [contact, setContact] = useState('0.05');
  const styles = useThemedStyles(activityScreenStyles);

  const g = gForceNoBounce(parseFloat(impact) || 0, parseFloat(contact) || 0.05);

  const save = async () => {
    const sessionId = await writeSessionOptimistic({
      activityType: 'parachute',
      teamName: team,
      score: Math.min(100, g * 10),
      payload: {
        gForce: g,
        accelMag: magnitude,
        impactMps: parseFloat(impact),
        contactS: parseFloat(contact),
      },
    });
    router.push(`/results/${sessionId}`);
  };

  return (
    <ExperimentScreen>
      <ActivityCard title="Parachute Drop" live>
        <StatReadout label="Live accel magnitude (g rough)" value={magnitude.toFixed(2)} />
        <StatReadout label="Calculated g-force (no bounce)" value={`${g.toFixed(2)}g`} />
        <FormField
          label="Impact speed (m/s)"
          value={impact}
          onChangeText={setImpact}
          keyboardType="decimal-pad"
          accessibilityLabel="Impact speed in meters per second"
        />
        <FormField
          label="Contact time (s)"
          value={contact}
          onChangeText={setContact}
          keyboardType="decimal-pad"
          accessibilityLabel="Contact time in seconds"
        />
        <View style={styles.actions}>
          <Button title="Save result" onPress={save} />
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        </View>
      </ActivityCard>
    </ExperimentScreen>
  );
}

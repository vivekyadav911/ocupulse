import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { FormField } from '../../components/FormField';
import { bendAngleFromShiftPixels } from '../../lib/calc/bendAngle';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useThemedStyles } from '../../theme/themedStyles';

export default function HandFanScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const styles = useThemedStyles(activityScreenStyles);
  const [shift, setShift] = useState('12');

  const angle = bendAngleFromShiftPixels(parseFloat(shift) || 0);

  const save = async () => {
    const sessionId = await writeSessionOptimistic({
      activityType: 'handfan',
      teamName: team,
      score: Math.min(100, angle),
      payload: { bendAngleDeg: angle, shiftPx: parseFloat(shift) },
    });
    router.push(`/results/${sessionId}`);
  };

  return (
    <ExperimentScreen>
      <ActivityCard title="Hand Fan">
        <Text style={styles.p}>
          MVP: enter centroid shift (px) from camera tracking, or replace with computer vision
          pipeline later.
        </Text>
        <FormField
          label="Shift (px)"
          value={shift}
          onChangeText={setShift}
          keyboardType="decimal-pad"
          accessibilityLabel="Centroid shift in pixels"
        />
        <Text style={styles.meta}>Estimated angle: {angle}°</Text>
        <View style={styles.actions}>
          <Button title="Save result" onPress={save} />
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        </View>
      </ActivityCard>
    </ExperimentScreen>
  );
}

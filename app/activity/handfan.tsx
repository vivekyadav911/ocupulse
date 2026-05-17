import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
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
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>Hand Fan</Text>
        <Text style={styles.p}>
          MVP: enter centroid shift (px) from camera tracking, or replace with computer vision
          pipeline later.
        </Text>
        <Text style={styles.label}>Shift (px)</Text>
        <TextInput
          value={shift}
          onChangeText={setShift}
          keyboardType="decimal-pad"
          style={styles.input}
          accessibilityLabel="Centroid shift in pixels"
          accessibilityHint="Enter the horizontal shift measured from camera tracking"
        />
        <Text style={styles.meta}>Estimated angle: {angle}°</Text>
        <Button title="Save result" onPress={save} />
      </Card>
    </View>
  );
}

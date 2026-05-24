import { Text, View } from 'react-native';
import type { BreathingReflection } from '../../lib/breathing/sessionState';
import { FormField } from '../FormField';
import { useThemedStyles } from '../../theme/themedStyles';

type BreathingReflectionFormProps = {
  predictedBpm: string;
  onPredictedChange: (value: string) => void;
  reflection: BreathingReflection;
  onReflectionChange: (partial: Partial<BreathingReflection>) => void;
  showPrediction?: boolean;
  predictionReadOnly?: boolean;
  showPostReflection?: boolean;
  stateLabel?: string;
};

export function BreathingReflectionForm({
  predictedBpm,
  onPredictedChange,
  reflection,
  onReflectionChange,
  showPrediction = true,
  predictionReadOnly = false,
  showPostReflection = false,
  stateLabel,
}: BreathingReflectionFormProps) {
  const styles = useThemedStyles((t) => ({
    title: {
      fontSize: t.typography.body,
      fontWeight: '700' as const,
      color: t.colors.text,
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
    },
    multiline: {
      minHeight: 72,
      textAlignVertical: 'top' as const,
    },
  }));

  const predictionLabel = stateLabel
    ? `Predict breaths per minute before recording (${stateLabel})`
    : 'Predict breaths per minute before recording';

  return (
    <View>
      {showPrediction ? (
        <>
          <Text style={styles.title}>Before recording</Text>
          <FormField
            label={predictionLabel}
            value={predictedBpm}
            onChangeText={predictionReadOnly ? undefined : onPredictedChange}
            editable={!predictionReadOnly}
            keyboardType="decimal-pad"
            placeholder="e.g. 16"
          />
        </>
      ) : null}
      {showPostReflection ? (
        <>
          <Text style={styles.title}>Reflection</Text>
          <FormField
            label="Were you right?"
            value={reflection.wereYouRight}
            onChangeText={(v) => onReflectionChange({ wereYouRight: v })}
            multiline
            style={styles.multiline}
            placeholder="How did your predictions compare to the recordings?"
          />
          <FormField
            label="Any surprises?"
            value={reflection.surprises}
            onChangeText={(v) => onReflectionChange({ surprises: v })}
            multiline
            style={styles.multiline}
            placeholder="What surprised you about your breathing rate?"
          />
        </>
      ) : null}
    </View>
  );
}

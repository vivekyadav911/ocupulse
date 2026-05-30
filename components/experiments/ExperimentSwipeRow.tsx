import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { Badge } from '../Badge';
import { activityDisplayName } from '../../lib/activities/labels';
import {
  shareExperimentAsPdf,
  shareExperimentAsText,
} from '../../lib/export/shareExperimentReport';
import type { ExperimentRecord } from '../../services/experimentsData';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

type ExperimentSwipeRowProps = {
  row: ExperimentRecord;
  isTeacher: boolean;
  onPress: () => void;
  onDelete: (sessionId: string) => void;
};

function ActionButton({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <RectButton
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: 72,
        backgroundColor: color,
      }}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 4 }}>{label}</Text>
    </RectButton>
  );
}

export function ExperimentSwipeRow({ row, isTeacher, onPress, onDelete }: ExperimentSwipeRowProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((t) => ({
    row: {
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    rowTitle: { fontWeight: '700', color: t.colors.text, fontSize: t.typography.body },
    rowMeta: { color: t.colors.muted, fontSize: t.typography.caption, marginTop: 2 },
    badgeRow: { flexDirection: 'row' as const, gap: t.spacing.xs, marginTop: t.spacing.xs },
    actions: { flexDirection: 'row' as const, height: '100%' as const },
  }));

  const confirmDelete = () => {
    Alert.alert('Delete experiment', 'Remove this experiment from your device and cloud library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(row.sessionId),
      },
    ]);
  };

  const renderLeftActions = () => (
    <View style={styles.actions}>
      <ActionButton
        label="Delete"
        icon="trash-outline"
        color={colors.danger}
        onPress={confirmDelete}
      />
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.actions}>
      <ActionButton
        label="Text"
        icon="document-text-outline"
        color={colors.accent}
        onPress={() => void shareExperimentAsText(row)}
      />
      <ActionButton
        label="PDF"
        icon="document-outline"
        color={colors.primaryButton ?? colors.accent}
        onPress={() => void shareExperimentAsPdf(row)}
      />
    </View>
  );

  const content = (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowTitle}>
        {activityDisplayName(row.activityType)} · {row.scoreLabel ?? row.score}
      </Text>
      <Text style={styles.rowMeta}>
        {isTeacher && row.studentFirstName ? `${row.studentFirstName} · ` : ''}
        {row.teamName} · {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '—'}
      </Text>
      {!row.synced ? (
        <View style={styles.badgeRow}>
          <Badge label="Pending sync" />
        </View>
      ) : null}
    </Pressable>
  );

  if (isTeacher) {
    return content;
  }

  return (
    <Swipeable renderLeftActions={renderLeftActions} renderRightActions={renderRightActions}>
      {content}
    </Swipeable>
  );
}

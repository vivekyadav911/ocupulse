import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { Team } from '../services/db/types';
import { useAppTheme } from '../theme/useAppTheme';

type TeamSelectFieldProps = {
  label?: string;
  teams: Team[];
  value: string | null;
  onChange: (teamId: string) => void;
  loading?: boolean;
  disabled?: boolean;
};

export function TeamSelectField({
  label = 'Team',
  teams,
  value,
  onChange,
  loading = false,
  disabled = false,
}: TeamSelectFieldProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [open, setOpen] = useState(false);
  const selected = teams.find((t) => t.id === value) ?? null;

  const styles = useMemo(
    () => ({
      label: {
        fontSize: typography.label,
        fontWeight: '700' as const,
        color: colors.muted,
        letterSpacing: 0.8,
        textTransform: 'uppercase' as const,
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
      },
      trigger: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        padding: spacing.sm,
        backgroundColor: colors.surface,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
      },
      triggerDisabled: { opacity: 0.6 },
      triggerText: {
        color: colors.text,
        fontSize: typography.body,
        flex: 1,
      },
      placeholder: { color: colors.muted },
      chevron: { color: colors.muted, fontSize: typography.body, marginLeft: spacing.sm },
      hint: {
        marginTop: spacing.xs,
        color: colors.muted,
        fontSize: typography.caption,
      },
      modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center' as const,
        padding: spacing.lg,
      },
      modalCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        maxHeight: '70%' as const,
        overflow: 'hidden' as const,
      },
      modalTitle: {
        fontSize: typography.subtitle,
        fontWeight: '800' as const,
        color: colors.text,
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      option: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      optionActive: { backgroundColor: `${colors.accent}18` },
      optionText: { color: colors.text, fontSize: typography.body },
      optionTextActive: { color: colors.accent, fontWeight: '700' as const },
      empty: {
        padding: spacing.md,
        color: colors.muted,
        fontSize: typography.body,
        lineHeight: 22,
      },
      closeRow: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      },
      closeText: {
        textAlign: 'center' as const,
        color: colors.accent,
        fontWeight: '700' as const,
        fontSize: typography.body,
      },
    }),
    [colors, spacing, radii, typography],
  );

  const placeholder = loading
    ? 'Loading teams…'
    : teams.length === 0
      ? 'No teams available yet'
      : 'Choose a team';

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[
          styles.trigger,
          (disabled || loading || teams.length === 0) && styles.triggerDisabled,
        ]}
        onPress={() => {
          if (!disabled && !loading && teams.length > 0) setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={selected ? `Team: ${selected.name}` : placeholder}
        accessibilityState={{ disabled: disabled || loading || teams.length === 0 }}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected?.name ?? placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {!loading && teams.length === 0 ? (
        <Text style={styles.hint}>
          Ask your teacher to create a team first. Teams appear here once they are set up.
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Choose your team</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {teams.length === 0 ? (
                <Text style={styles.empty}>No teacher teams are available yet.</Text>
              ) : (
                teams.map((team) => {
                  const active = team.id === value;
                  return (
                    <Pressable
                      key={team.id}
                      style={[styles.option, active && styles.optionActive]}
                      onPress={() => {
                        onChange(team.id);
                        setOpen(false);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>
                        {team.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
            <Pressable style={styles.closeRow} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

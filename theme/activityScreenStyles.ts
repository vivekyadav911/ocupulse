import type { AppTheme } from './useAppTheme';

/** Shared layout styles for activity screens. */
export function activityScreenStyles(t: AppTheme) {
  return {
    wrap: { flex: 1, padding: t.spacing.md },
    title: {
      fontSize: 22,
      fontWeight: '800' as const,
      marginBottom: t.spacing.md,
      color: t.colors.text,
    },
    label: { fontWeight: '600' as const, marginTop: t.spacing.sm, color: t.colors.text },
    p: { color: t.colors.muted, marginBottom: t.spacing.md },
    input: {
      borderWidth: 1,
      borderColor: t.colors.muted,
      borderRadius: 8,
      padding: t.spacing.sm,
      marginTop: t.spacing.xs,
      color: t.colors.text,
      backgroundColor: t.colors.surface,
    },
    meta: { color: t.colors.muted, marginTop: t.spacing.sm },
    addr: { color: t.colors.muted, marginBottom: t.spacing.sm },
    map: { width: '100%' as const, height: 180, marginTop: t.spacing.md, borderRadius: 12 },
    instr: {
      fontSize: 16,
      marginVertical: t.spacing.md,
      fontWeight: '600' as const,
      color: t.colors.accent,
    },
    trace: {
      height: 140,
      borderWidth: 2,
      borderColor: t.colors.primary,
      borderRadius: 12,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginVertical: t.spacing.md,
    },
    traceHelp: { color: t.colors.muted },
  };
}

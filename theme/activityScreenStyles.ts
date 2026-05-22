import type { AppTheme } from './useAppTheme';

/** Shared layout styles for activity screens. */
export function activityScreenStyles(t: AppTheme) {
  return {
    cardHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: t.spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: '800' as const,
      color: t.colors.text,
      flex: 1,
    },
    p: { color: t.colors.muted, marginBottom: t.spacing.md, lineHeight: 22 },
    meta: { color: t.colors.muted, marginTop: t.spacing.sm, marginBottom: t.spacing.sm },
    addr: { color: t.colors.muted, marginBottom: t.spacing.sm },
    map: { width: '100%' as const, height: 180, marginTop: t.spacing.md, borderRadius: t.radii.lg },
    instr: {
      fontSize: 16,
      marginVertical: t.spacing.md,
      fontWeight: '600' as const,
      color: t.colors.accent,
    },
    trace: {
      height: 140,
      borderWidth: 2,
      borderColor: t.colors.border,
      borderRadius: t.radii.lg,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginVertical: t.spacing.md,
      backgroundColor: t.colors.readoutBg,
    },
    traceHelp: { color: t.colors.muted },
    actions: { marginTop: t.spacing.sm },
  };
}

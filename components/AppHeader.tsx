import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from './BackButton';
import { useAppTheme } from '../theme/useAppTheme';

type AppHeaderProps = {
  /** Tab screens already have a top safe-area battery strip — skip duplicate inset. */
  compactTop?: boolean;
};

export function AppHeader({ compactTop = false }: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        title: {
          fontSize: typography.subtitle,
          fontWeight: '800',
          color: colors.text,
        },
        iconBtn: {
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.readoutBg,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        left: { minWidth: 72 },
        right: { minWidth: 72, alignItems: 'flex-end' as const },
      }),
    [colors, spacing, typography],
  );

  return (
    <View style={[styles.bar, { paddingTop: compactTop ? spacing.xs : insets.top + spacing.xs }]}>
      <View style={styles.left}>
        <BackButton compact />
      </View>
      <Text style={styles.title}>Ocupulse</Text>
      <View style={styles.right}>
        <Pressable
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => router.push('/(tabs)/settings')}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color={colors.accent} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

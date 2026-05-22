import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from './BackButton';
import { useAppTheme } from '../theme/useAppTheme';

/** Auth subpages (register, onboarding) — back only when history exists. */
export function AuthScreenHeader() {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useAppTheme();

  return (
    <View
      style={{
        paddingTop: insets.top + spacing.xs,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: colors.authBg,
        minHeight: insets.top + spacing.xs + 40,
        justifyContent: 'flex-end',
      }}
    >
      <BackButton />
    </View>
  );
}

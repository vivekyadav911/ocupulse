import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShowBackButton } from '../hooks/useGoBack';
import { returnToLogin } from '../lib/returnToLogin';
import { useAppTheme } from '../theme/useAppTheme';
import { BackButton } from './BackButton';

type AuthScreenHeaderProps = {
  /** Show "Back to login" when there is no stack history (e.g. after quick join). */
  backToLogin?: boolean;
};

/** Auth subpages (register, onboarding, setup) — back when history exists, or explicit login link. */
export function AuthScreenHeader({ backToLogin }: AuthScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showBack = useShowBackButton();
  const { colors, spacing, typography } = useAppTheme();

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
      {showBack ? (
        <BackButton />
      ) : backToLogin ? (
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            minHeight: 40,
            minWidth: 40,
            paddingHorizontal: spacing.sm,
            justifyContent: 'center',
          }}
          onPress={() => void returnToLogin(router)}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
          accessibilityHint="Returns to the login screen"
        >
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
          <Text
            style={{
              fontSize: typography.body,
              fontWeight: '600',
              color: colors.accent,
            }}
          >
            Back to login
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

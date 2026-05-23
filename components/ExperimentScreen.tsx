import React, { type PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { AppHeader } from './AppHeader';
import { PageTitle } from './PageTitle';
import { useAppTheme } from '../theme/useAppTheme';

export function ExperimentScreen({
  children,
  title = 'Experiment',
  eyebrow = 'Active session',
}: PropsWithChildren<{ title?: string; eyebrow?: string }>) {
  const { colors, spacing } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xl,
        }}
      >
        <PageTitle eyebrow={eyebrow} title={title} />
        {children}
      </ScrollView>
    </View>
  );
}

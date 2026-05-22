import React, { type PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { AppHeader } from './AppHeader';
import { PageTitle } from './PageTitle';
import { useAppTheme } from '../theme/useAppTheme';

export function ExperimentScreen({ children }: PropsWithChildren) {
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
        <PageTitle eyebrow="Active session" title="Experiment" />
        {children}
      </ScrollView>
    </View>
  );
}

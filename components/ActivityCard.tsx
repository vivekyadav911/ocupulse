import React, { type PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import { Card } from './Card';
import { LiveBadge } from './LiveBadge';
import { activityScreenStyles } from '../theme/activityScreenStyles';
import { useThemedStyles } from '../theme/themedStyles';

type ActivityCardProps = PropsWithChildren<{
  title: string;
  live?: boolean;
}>;

export function ActivityCard({ title, live, children }: ActivityCardProps) {
  const styles = useThemedStyles(activityScreenStyles);

  return (
    <Card accent bordered>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{title}</Text>
        {live ? <LiveBadge /> : null}
      </View>
      {children}
    </Card>
  );
}

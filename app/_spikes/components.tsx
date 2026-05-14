import { ScrollView, StyleSheet } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatReadout } from '../../components/StatReadout';
import { colors, spacing } from '../../theme/tokens';

export default function ComponentsSpike() {
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Card>
        <StatReadout label="Demo" value="1,480" />
        <Button title="Primary" onPress={() => {}} />
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Button title="Danger" variant="danger" onPress={() => {}} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md, backgroundColor: colors.surfaceAlt },
});

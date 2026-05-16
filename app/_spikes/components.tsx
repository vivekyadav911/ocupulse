import { ScrollView } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatReadout } from '../../components/StatReadout';
import { useThemedStyles } from '../../theme/themedStyles';

export default function ComponentsSpike() {
  const styles = useThemedStyles((t) => ({
    wrap: { padding: t.spacing.md },
  }));

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Card>
        <StatReadout label="Demo KPI" value="1,480" />
        <Button title="Primary" onPress={() => {}} />
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Button title="Danger" variant="danger" onPress={() => {}} />
      </Card>
    </ScrollView>
  );
}

import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatReadout } from '../../components/StatReadout';
import { showAlert } from '../../lib/alert';
import { useThemedStyles } from '../../theme/themedStyles';

export default function ComponentsSpike() {
  const [lastTap, setLastTap] = useState('Tap a button to test feedback.');
  const styles = useThemedStyles((t) => ({
    wrap: { padding: t.spacing.md, paddingBottom: t.spacing.xl * 2 },
    status: { marginTop: t.spacing.md, color: t.colors.muted, fontSize: 14 },
  }));

  const onPrimary = () => {
    setLastTap('Primary pressed');
    showAlert('Primary', 'Primary button works.');
  };

  const onSecondary = () => {
    setLastTap('Secondary pressed');
    showAlert('Secondary', 'Secondary button works.');
  };

  const onDanger = () => {
    setLastTap('Danger pressed');
    showAlert('Danger', 'Danger button works.');
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Card>
        <StatReadout label="Demo KPI" value="1,480" />
        <Button title="Primary" onPress={onPrimary} />
        <Button title="Secondary" variant="secondary" onPress={onSecondary} />
        <Button title="Danger" variant="danger" onPress={onDanger} />
        <StatReadout label="Last tap" value={lastTap} />
      </Card>
    </ScrollView>
  );
}

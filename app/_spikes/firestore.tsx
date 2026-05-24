import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '../../components/Button';
import { showAlert } from '../../lib/alert';
import { subscribeLeaderboard, type LeaderRow } from '../../services/leaderboard';
import { syncOutbox, writeSessionOptimistic } from '../../services/firestore';
import { colors, spacing } from '../../theme/tokens';

export default function FirestoreSpike() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [status, setStatus] = useState('Attach listener, then write scores.');
  const [listening, setListening] = useState(false);
  const subRef = useRef<ReturnType<typeof subscribeLeaderboard> | null>(null);

  useEffect(() => {
    return () => {
      subRef.current?.unsubscribe();
      subRef.current = null;
    };
  }, []);

  const write = async () => {
    const score = Math.round(Math.random() * 100);
    try {
      const id = await writeSessionOptimistic({
        activityType: 'reaction',
        teamName: 'SpikeTeam',
        score,
        payload: { spike: true, writtenAt: Date.now() },
      });
      await syncOutbox();
      subRef.current?.refresh();
      setStatus(`Wrote SpikeTeam score ${score} (id ${id.slice(0, 12)}…)`);
      showAlert('Score saved', `Local SQLite + outbox updated.\nScore: ${score}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(`Write failed: ${msg}`);
      showAlert('Write failed', msg);
    }
  };

  const listen = () => {
    subRef.current?.unsubscribe();
    const sub = subscribeLeaderboard('reaction', (next) => {
      setRows(next);
      setStatus(`Listening — ${next.length} reaction row(s). Write to add more.`);
    });
    subRef.current = sub;
    setListening(true);
    sub.refresh();
  };

  const stopListen = () => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    setListening(false);
    setStatus('Listener stopped.');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.t}>Firestore write + leaderboard listener</Text>
      <Text style={styles.status}>{status}</Text>
      <Button title="Write random score" onPress={() => void write()} />
      <Button
        title={listening ? 'Refresh listener' : 'Attach listener'}
        variant="secondary"
        onPress={listen}
      />
      {listening ? <Button title="Stop listener" variant="secondary" onPress={stopListen} /> : null}
      <Text style={styles.hint}>
        Rows update when you write (local + cloud). Same list until a new score is saved — that is
        expected.
      </Text>
      <Text style={styles.out} selectable>
        {rows.length
          ? rows.map((r) => `${r.teamName}: ${r.scoreLabel ?? Math.round(r.score)}`).join('\n')
          : 'No rows yet.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  t: { marginBottom: spacing.sm, color: colors.text, fontWeight: '600' },
  status: { marginBottom: spacing.md, color: colors.muted, fontSize: 13 },
  hint: { marginTop: spacing.md, marginBottom: spacing.sm, color: colors.muted, fontSize: 12 },
  out: { fontFamily: 'monospace', fontSize: 13, color: colors.text, lineHeight: 20 },
});

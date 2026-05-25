import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { Button } from '../../components/Button';
import { showAlert } from '../../lib/alert';
import { getFirestoreDb } from '../../services/firebase';
import { colors, spacing } from '../../theme/tokens';

type NoteRow = { id: string; text: string };

export default function FirestoreNotesSpike() {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('Create a note, then read the list below.');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const db = getFirestoreDb();
    if (!db) {
      setStatus('Firestore not configured — check .env');
      setNotes([]);
      return;
    }
    const snap = await getDocs(query(collection(db, 'spike_notes'), orderBy('createdAt', 'desc')));
    setNotes(
      snap.docs.map((d) => ({
        id: d.id,
        text: String((d.data() as { text?: string }).text ?? ''),
      })),
    );
    setStatus(`Read ${snap.size} note(s) from Firestore.`);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = async () => {
    const text = draft.trim();
    if (!text) {
      showAlert('Note', 'Enter some text first.');
      return;
    }
    const db = getFirestoreDb();
    if (!db) {
      showAlert('Firestore', 'Not configured.');
      return;
    }
    setBusy(true);
    try {
      const ref = await addDoc(collection(db, 'spike_notes'), {
        text,
        createdAt: serverTimestamp(),
      });
      setDraft('');
      await reload();
      setStatus(`Created note ${ref.id.slice(0, 10)}…`);
      showAlert('Saved', 'Note written to Firestore and read back in the list.');
    } catch (e) {
      showAlert('Save failed', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const db = getFirestoreDb();
    if (!db) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'spike_notes', id));
      await reload();
    } catch (e) {
      showAlert('Delete failed', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.t}>Firestore notes (create + read)</Text>
      <Text style={styles.status}>{status}</Text>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder="Type a note…"
        placeholderTextColor={colors.muted}
        multiline
      />
      <Button
        title="Save to Firestore"
        variant="accent"
        onPress={() => void save()}
        disabled={busy}
      />
      <Button
        title="Reload list"
        variant="secondary"
        onPress={() => void reload()}
        disabled={busy}
      />
      <Text style={styles.hint}>Stored in collection spike_notes (assessment demo).</Text>
      {notes.map((n) => (
        <Pressable key={n.id} style={styles.row} onPress={() => void remove(n.id)}>
          <Text style={styles.rowText}>{n.text}</Text>
          <Text style={styles.meta}>Tap to delete · {n.id.slice(0, 8)}…</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surfaceAlt },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  t: { fontSize: 18, fontWeight: '800', marginBottom: spacing.sm, color: colors.text },
  status: { color: colors.muted, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 72,
    marginBottom: spacing.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  hint: { color: colors.muted, fontSize: 12, marginVertical: spacing.sm },
  row: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  rowText: { color: colors.text },
  meta: { fontSize: 11, color: colors.muted },
});

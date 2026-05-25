import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { deleteOutboxForPath } from '../../services/db/sqlite';
import { syncAll } from '../../services/sync';
import { ActivityRow } from '../../components/ActivityRow';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageTitle, TeamSubtitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import { HomeQuickTools } from '../../components/HomeQuickTools';
import { StemmBannerAd } from '../../components/StemmBannerAd';
import { ACTIVITY_CATALOG } from '../../lib/activities/catalog';
import { canStudentRunExperiments } from '../../lib/studentAccess';
import { PendingApprovalBanner } from '../../components/PendingApprovalBanner';
import {
  backfillTeacherTeamNameLower,
  fetchStudentMemberStatus,
  subscribeStudentMemberStatus,
} from '../../services/profiles';
import {
  approveTeamStudent,
  createManagedTeam,
  removeTeamStudent,
} from '../../services/teamManagement';
import {
  subscribeTeacherTeams,
  subscribeTeamStudents,
  type StudentRosterRow,
  type TeamSummary,
} from '../../services/teacher';
import { getCurrentUser } from '../../services/auth';
import {
  ensureNotificationPermissions,
  notifyStudentJoinRequest,
} from '../../services/notifications';
import { useSessionStore } from '../../store/sessionStore';
import { useThemedStyles } from '../../theme/themedStyles';

function usePullRefresh(refreshWork: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshWork();
    } catch (e) {
      console.warn('[Ocupulse] home refresh failed', e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshWork]);
  return { refreshing, onRefresh };
}

function StudentHome() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const teamId = useSessionStore((s) => s.teamId);
  const studentId = useSessionStore((s) => s.studentId);
  const teamMemberStatus = useSessionStore((s) => s.teamMemberStatus);
  const setTeam = useSessionStore((s) => s.setTeam);
  const canRun = canStudentRunExperiments(teamMemberStatus);

  useEffect(() => {
    if (!teamId || !studentId) return;
    const rosterPath = `teams/${teamId}/students/${studentId}`;
    return subscribeStudentMemberStatus(teamId, studentId, (status) => {
      setTeam({ teamMemberStatus: status });
      if (status === 'active') {
        void deleteOutboxForPath(rosterPath);
      }
    });
  }, [teamId, studentId, setTeam]);

  useFocusEffect(
    useCallback(() => {
      if (!teamId || !studentId) return;
      void fetchStudentMemberStatus(teamId, studentId).then((status) => {
        setTeam({ teamMemberStatus: status });
      });
    }, [teamId, studentId, setTeam]),
  );

  const refreshWork = useCallback(async () => {
    await syncAll();
    if (teamId && studentId) {
      const status = await fetchStudentMemberStatus(teamId, studentId);
      setTeam({ teamMemberStatus: status });
    }
  }, [teamId, studentId, setTeam]);

  const { refreshing, onRefresh } = usePullRefresh(refreshWork);

  const styles = useThemedStyles((t) => ({
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: t.spacing.md,
    },
    sectionTitle: {
      fontSize: t.typography.subtitle,
      fontWeight: '800',
      color: t.colors.text,
    },
    card: { marginBottom: t.spacing.md },
  }));

  return (
    <ScreenShell refreshing={refreshing} onRefresh={onRefresh} compactHeader>
      <PageTitle title="Dashboard" />
      <TeamSubtitle team={team} />
      <StemmBannerAd />
      <HomeQuickTools />
      {!canRun ? <PendingApprovalBanner /> : null}
      <Card bordered style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <Badge label={`${ACTIVITY_CATALOG.length} Experiments`} />
        </View>
        {ACTIVITY_CATALOG.map((a) => (
          <ActivityRow
            key={a.path}
            title={a.title}
            onPress={() => (canRun ? router.push(a.path) : undefined)}
            disabled={!canRun}
          />
        ))}
      </Card>
      <Button
        title="Experiments Data"
        variant="accent"
        icon="folder-open-outline"
        onPress={() => router.push('/experiments-data')}
        disabled={!canRun}
      />
    </ScreenShell>
  );
}

function TeacherHome() {
  const router = useRouter();
  const user = getCurrentUser();
  const activeTeamId = useSessionStore((s) => s.activeTeamId);
  const teamName = useSessionStore((s) => s.teamName);
  const setTeam = useSessionStore((s) => s.setTeam);
  const [students, setStudents] = useState<StudentRosterRow[]>([]);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [busy, setBusy] = useState(false);
  const seenPendingRef = useRef<Set<string>>(new Set());
  const rosterInitRef = useRef(false);

  const styles = useThemedStyles((t) => ({
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: t.spacing.md,
    },
    sectionTitle: {
      fontSize: t.typography.subtitle,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    sub: { color: t.colors.muted, marginBottom: t.spacing.md, lineHeight: 20 },
    card: { marginBottom: t.spacing.md },
    row: {
      paddingVertical: t.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    name: { fontWeight: '700', color: t.colors.text, fontSize: t.typography.body },
    meta: { color: t.colors.muted, fontSize: t.typography.caption, marginTop: 2 },
    empty: { color: t.colors.muted, fontStyle: 'italic' as const },
    teamChip: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginRight: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    teamChipOn: { borderColor: t.colors.accent, backgroundColor: `${t.colors.accent}18` },
    teamChipText: {
      color: t.colors.text,
      fontWeight: '600' as const,
      fontSize: t.typography.caption,
    },
    teamChipTextOn: { color: t.colors.accent, fontWeight: '800' as const },
    chipRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      marginBottom: t.spacing.md,
    },
    input: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radii.md,
      padding: t.spacing.sm,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    rowActions: { flexDirection: 'row' as const, gap: t.spacing.sm, marginTop: t.spacing.xs },
    action: { color: t.colors.accent, fontWeight: '700' as const, fontSize: t.typography.caption },
    danger: { color: t.colors.danger, fontWeight: '700' as const, fontSize: t.typography.caption },
    teamId: {
      fontFamily: 'monospace',
      color: t.colors.accent,
      fontSize: t.typography.caption,
      marginBottom: t.spacing.sm,
    },
    pendingRow: {
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.sm,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.accent,
      backgroundColor: `${t.colors.accent}12`,
      marginBottom: t.spacing.sm,
    },
    liveHint: {
      fontSize: t.typography.caption,
      color: t.colors.success,
      fontWeight: '600' as const,
      marginBottom: t.spacing.sm,
    },
  }));

  useEffect(() => {
    if (!user?.uid) return;
    void backfillTeacherTeamNameLower(user.uid);
    return subscribeTeacherTeams(user.uid, setTeams);
  }, [user?.uid]);

  useEffect(() => {
    if (teams.length === 0) return;
    const match = activeTeamId ? teams.find((t) => t.id === activeTeamId) : undefined;
    if (!match) {
      const pick = teams[0]!;
      setTeam({ activeTeamId: pick.id, teamId: pick.id, teamName: pick.name });
    }
  }, [teams, activeTeamId, setTeam]);

  useEffect(() => {
    if (!activeTeamId) return;
    return subscribeTeamStudents(activeTeamId, setStudents);
  }, [activeTeamId]);

  useEffect(() => {
    rosterInitRef.current = false;
    seenPendingRef.current = new Set();
  }, [activeTeamId]);

  useFocusEffect(
    useCallback(() => {
      void ensureNotificationPermissions();
      if (user?.uid) void backfillTeacherTeamNameLower(user.uid);
    }, [user?.uid]),
  );

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.firstName.localeCompare(b.firstName)),
    [students],
  );

  const pending = sortedStudents.filter((s) => s.status === 'pending');

  useEffect(() => {
    if (!activeTeamId) return;
    const currentIds = new Set(pending.map((s) => s.id));
    if (!rosterInitRef.current) {
      rosterInitRef.current = true;
      seenPendingRef.current = currentIds;
      return;
    }
    const newcomers = pending.filter((s) => !seenPendingRef.current.has(s.id));
    seenPendingRef.current = currentIds;
    if (newcomers.length === 0) return;

    const names = newcomers.map((s) => s.firstName).join(', ');
    Alert.alert(
      'New join request',
      `${names} requested to join ${teamName}. Scroll to Join requests to accept.`,
    );
    void notifyStudentJoinRequest(names, teamName);
  }, [pending, activeTeamId, teamName]);

  const refreshWork = useCallback(async () => {
    await syncAll();
    if (user?.uid) await backfillTeacherTeamNameLower(user.uid);
  }, [user?.uid]);

  const { refreshing, onRefresh } = usePullRefresh(refreshWork);

  const addTeam = async () => {
    if (!newTeamName.trim()) {
      Alert.alert('Team', 'Enter a team name.');
      return;
    }
    setBusy(true);
    try {
      const created = await createManagedTeam(newTeamName);
      setTeam({
        activeTeamId: created.id,
        teamId: created.id,
        teamName: created.name,
        managedTeamIds: created.managedTeamIds,
      });
      setNewTeamName('');
      Alert.alert('Team created', `Team ID: ${created.id}`);
    } catch (e) {
      Alert.alert('Team', e instanceof Error ? e.message : 'Could not create team');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell refreshing={refreshing} onRefresh={onRefresh} compactHeader>
      <PageTitle title="Teacher dashboard" />
      <TeamSubtitle team={teamName} />
      <HomeQuickTools />
      {activeTeamId ? (
        <Text style={styles.teamId}>
          Watching team: {teamName} · ID {activeTeamId}
          {'\n'}Students must type team name &quot;{teamName}&quot; (any capitalization).
        </Text>
      ) : null}

      <Card bordered style={styles.card}>
        <Text style={styles.sectionTitle}>Your teams</Text>
        <View style={styles.chipRow}>
          {teams.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.teamChip, activeTeamId === t.id && styles.teamChipOn]}
              onPress={() => setTeam({ activeTeamId: t.id, teamId: t.id, teamName: t.name })}
            >
              <Text style={[styles.teamChipText, activeTeamId === t.id && styles.teamChipTextOn]}>
                {t.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="New team name"
          placeholderTextColor={styles.sub.color}
          value={newTeamName}
          onChangeText={setNewTeamName}
        />
        <Button title="Create team" variant="secondary" onPress={addTeam} disabled={busy} />
      </Card>

      <Card bordered style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Join requests</Text>
          {pending.length > 0 ? <Badge label={`${pending.length} new`} /> : null}
        </View>
        {activeTeamId ? (
          <Text style={styles.liveHint}>
            Live — updates when a student signs up with your team name
          </Text>
        ) : null}
        <Text style={styles.sub}>
          Students appear here as soon as they register. They cannot run experiments until you
          accept.
        </Text>
        {!activeTeamId ? (
          <Text style={styles.empty}>Select or create a team above.</Text>
        ) : pending.length === 0 ? (
          <Text style={styles.empty}>
            No pending requests. Share team name &quot;{teamName}&quot;.
          </Text>
        ) : (
          pending.map((s) => (
            <View key={s.id} style={styles.pendingRow}>
              <Text style={styles.name}>{s.firstName}</Text>
              <Text style={styles.meta}>{s.email ?? 'No email'} · Waiting</Text>
              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => {
                    void approveTeamStudent(activeTeamId, s.id).catch((e) =>
                      Alert.alert('Approve', e instanceof Error ? e.message : 'Failed'),
                    );
                  }}
                >
                  <Text style={styles.action}>Accept</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void removeTeamStudent(activeTeamId, s.id).catch((e) =>
                      Alert.alert('Remove', e instanceof Error ? e.message : 'Failed'),
                    );
                  }}
                >
                  <Text style={styles.danger}>Decline</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </Card>

      <Card bordered style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Team roster</Text>
          <Badge label={`${sortedStudents.length} members`} />
        </View>
        {!activeTeamId ? (
          <Text style={styles.empty}>Select a team to see members.</Text>
        ) : sortedStudents.length === 0 ? (
          <Text style={styles.empty}>No members yet.</Text>
        ) : (
          sortedStudents.map((s) => (
            <View key={s.id} style={styles.row}>
              <Pressable
                onPress={() =>
                  s.status !== 'pending' ? router.push(`/(tabs)/student/${s.id}`) : undefined
                }
              >
                <Text style={styles.name}>{s.firstName}</Text>
                <Text style={styles.meta}>
                  {s.email ?? 'No email'} · {s.status === 'pending' ? 'Pending' : 'Active'}
                </Text>
              </Pressable>
              {s.status === 'pending' ? (
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => {
                      void approveTeamStudent(activeTeamId, s.id);
                    }}
                  >
                    <Text style={styles.action}>Accept</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => {
                      Alert.alert('Remove student', `Remove ${s.firstName} from the team?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => void removeTeamStudent(activeTeamId, s.id),
                        },
                      ]);
                    }}
                  >
                    <Text style={styles.danger}>Remove</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </Card>

      <Card bordered style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Run experiments</Text>
          <Badge label={`${ACTIVITY_CATALOG.length} activities`} />
        </View>
        <Text style={styles.sub}>
          Try any STEMM Lab activity yourself — same as student quick join. Results save to your
          personal practice library (not team roster scores).
        </Text>
        {ACTIVITY_CATALOG.map((a) => (
          <ActivityRow key={a.path} title={a.title} onPress={() => router.push(a.path)} />
        ))}
        <Button
          title="My experiment results"
          variant="accent"
          icon="folder-open-outline"
          onPress={() =>
            router.push({ pathname: '/experiments-data', params: { scope: 'personal' } })
          }
        />
      </Card>

      <Card bordered style={styles.card}>
        <Text style={styles.sectionTitle}>Team management</Text>
        <Text style={styles.sub}>
          Create teams, approve join requests, and review student experiment data. Student sign-up
          still requires your approval when they use your team name.
        </Text>
        <Button
          title="Team experiment library"
          variant="secondary"
          icon="people-outline"
          onPress={() => router.push({ pathname: '/experiments-data', params: { scope: 'team' } })}
        />
      </Card>
    </ScreenShell>
  );
}

export default function HomeScreen() {
  const role = useSessionStore((s) => s.role);
  if (role === 'teacher') return <TeacherHome />;
  return <StudentHome />;
}

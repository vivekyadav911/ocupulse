import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Switch, Text, View } from 'react-native';
import { ActivityCard } from '../../components/ActivityCard';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { FormField } from '../../components/FormField';
import { LinearAccelCharts } from '../../components/LinearAccelCharts';
import { StatReadout } from '../../components/StatReadout';
import { useAccelerometer } from '../../hooks/useAccelerometer';
import { useDeviceMotionLinearAccel } from '../../hooks/useDeviceMotionLinearAccel';
import { estimateImpactImpulse } from '../../lib/calc/impactImpulse';
import type { AccelTimelineSample } from '../../lib/calc/impactImpulse';
import { gForceNoBounce } from '../../lib/calc/gforce';
import { writeSessionOptimistic } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { activityScreenStyles } from '../../theme/activityScreenStyles';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const TRANSFER_WINDOW_SEC = 10;

type FrozenImpulseSnapshot = {
  deltaVMps: number;
  contactTimeS: number;
  peakMagnitudeMs2: number | null;
  referenceG: number;
};

export default function ParachuteScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const team = useSessionStore((s) => s.teamName);
  const dm = useDeviceMotionLinearAccel();
  const accelRaw = useAccelerometer();

  const useDmStream = !dm.motionDenied && dm.available === true;

  const plotX = useDmStream ? dm.x : accelRaw.x;
  const plotY = useDmStream ? dm.y : accelRaw.y;
  const plotZ = useDmStream ? dm.z : accelRaw.z;
  const plotMagLive = useDmStream ? dm.magnitude : accelRaw.magnitude;

  const impulseSamples: AccelTimelineSample[] = useDmStream ? dm.buffer : accelRaw.buffer;

  const impulse = useMemo(() => estimateImpactImpulse(impulseSamples), [impulseSamples]);

  const [impact, setImpact] = useState('2.0');
  const [contact, setContact] = useState('0.05');
  const [showLiveGraphs, setShowLiveGraphs] = useState(false);
  const [transferSecsLeft, setTransferSecsLeft] = useState(0);
  const [frozenImpulse, setFrozenImpulse] = useState<FrozenImpulseSnapshot | null>(null);
  const transferTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTransferTicker = () => {
    if (transferTickRef.current != null) {
      clearInterval(transferTickRef.current);
      transferTickRef.current = null;
    }
  };

  useEffect(() => clearTransferTicker, []);

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    graphToggleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: t.spacing.sm,
      marginBottom: t.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    graphToggleLabel: {
      flex: 1,
      paddingRight: t.spacing.md,
      fontSize: t.typography.body,
      fontWeight: '600' as const,
      color: t.colors.text,
    },
    graphToggleHint: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.md,
      lineHeight: 18,
    },
    transferBanner: {
      marginTop: t.spacing.md,
      marginBottom: t.spacing.sm,
      padding: t.spacing.md,
      borderRadius: t.radii.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.readoutBg,
    },
    transferTitle: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      color: t.colors.accent,
      marginBottom: t.spacing.xs,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
    },
    transferCountdown: {
      fontSize: t.typography.subtitle,
      fontWeight: '800' as const,
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    transferBody: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
      lineHeight: 18,
    },
    transferNumbers: {
      fontSize: t.typography.body,
      fontWeight: '600' as const,
      color: t.colors.text,
      lineHeight: 22,
    },
  }));

  const gManual = gForceNoBounce(parseFloat(impact) || 0, parseFloat(contact) || 0.05);

  const gFromImpulse =
    impulse.deltaVMps != null && impulse.contactTimeS != null && impulse.contactTimeS > 0
      ? gForceNoBounce(impulse.deltaVMps, impulse.contactTimeS)
      : null;

  const applyEstimate = () => {
    const dv = impulse.deltaVMps;
    const ct = impulse.contactTimeS;
    if (dv != null && ct != null && ct > 0) {
      setImpact(dv.toFixed(2));
      setContact(ct.toFixed(3));
      const refG = gForceNoBounce(dv, ct);
      setFrozenImpulse({
        deltaVMps: dv,
        contactTimeS: ct,
        peakMagnitudeMs2: impulse.peakMagnitudeMs2,
        referenceG: refG,
      });
      clearTransferTicker();
      setTransferSecsLeft(TRANSFER_WINDOW_SEC);

      transferTickRef.current = setInterval(() => {
        setTransferSecsLeft((s) => {
          if (s <= 1) {
            clearTransferTicker();
            setFrozenImpulse(null);
            return 0;
          }
          return s - 1;
        });
      }, 1000);

      void AccessibilityInfo.isScreenReaderEnabled()
        .then((on) => {
          if (on) {
            AccessibilityInfo.announceForAccessibility(
              `${TRANSFER_WINDOW_SEC} second window for copied sensor estimate`,
            );
          }
        })
        .catch(() => {});
    }
  };

  const canApply =
    impulse.deltaVMps != null && impulse.contactTimeS != null && impulse.contactTimeS > 0;

  const save = async () => {
    const impactMps = parseFloat(impact) || 0;
    const contactS = parseFloat(contact) || 0.05;
    const sessionId = await writeSessionOptimistic({
      activityType: 'parachute',
      teamName: team,
      score: Math.min(100, gManual * 10),
      payload: {
        gForce: gManual,
        accelMag: plotMagLive,
        impactMps,
        contactS,
        accelSource: useDmStream ? 'deviceMotion_linear' : 'accelerometer_fallback',
        sensorImpulseEstimate: {
          peakMagnitudeMs2: impulse.peakMagnitudeMs2,
          contactTimeS: impulse.contactTimeS,
          deltaVMps: impulse.deltaVMps,
        },
      },
    });
    router.push(`/results/${sessionId}`);
  };

  return (
    <ExperimentScreen>
      <ActivityCard title="Parachute Drop" live>
        <View style={styles.graphToggleRow}>
          <Text style={styles.graphToggleLabel}>Live acceleration graphs</Text>
          <Switch
            accessibilityRole="switch"
            accessibilityLabel="Live acceleration graphs"
            accessibilityHint="Shows or hides Phyphox-style acceleration charts on this screen."
            accessibilityState={{ checked: showLiveGraphs }}
            value={showLiveGraphs}
            onValueChange={setShowLiveGraphs}
            trackColor={{ false: colors.border, true: colors.accentMuted }}
            thumbColor={showLiveGraphs ? colors.accent : colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>

        {!showLiveGraphs ? (
          <Text style={styles.graphToggleHint}>
            Turn on to plot x / y / z linear acceleration here without leaving this screen.
          </Text>
        ) : null}

        {showLiveGraphs ? (
          <>
            {!useDmStream ? (
              <Text style={styles.p}>
                Charts show raw accelerometer (gravity included) until DeviceMotion is available —
                Phyphox-style linear accel requires motion permission and supported hardware.
                {dm.motionDenied ? ' Motion permission denied in browser / settings.' : ''}
              </Text>
            ) : null}
            <LinearAccelCharts x={plotX} y={plotY} z={plotZ} />
          </>
        ) : null}

        <StatReadout
          label="Sensor rate (estimated Hz)"
          value={(useDmStream ? dm.hz : accelRaw.hz).toFixed(0)}
        />

        <StatReadout label="Live |a| — raw magnitude (mixed axes)" value={plotMagLive.toFixed(2)} />

        <StatReadout
          label="Δv impulse est. ≈ speed if no rebound (sensor, m/s)"
          value={fmtOpt(impulse.deltaVMps, 3)}
        />

        <StatReadout
          label="Contact time est. (sensor, s)"
          value={fmtOpt(impulse.contactTimeS, 3)}
        />

        <StatReadout
          label="Peak linear |a| in window (m/s²)"
          value={fmtOpt(impulse.peakMagnitudeMs2, 1)}
        />

        <StatReadout
          label="g-force from impulse Δv÷t÷g — reference"
          value={gFromImpulse != null ? `${gFromImpulse.toFixed(2)}g` : '—'}
        />

        <Button
          title="Fill inputs from sensor estimate"
          variant="secondary"
          onPress={applyEstimate}
          disabled={!canApply}
        />

        {frozenImpulse !== null && transferSecsLeft > 0 ? (
          <View
            style={styles.transferBanner}
            accessible
            accessibilityLabel={`Copied sensor snapshot, ${transferSecsLeft} seconds remaining`}
          >
            <Text style={styles.transferTitle}>Captured from sensor</Text>
            <Text
              style={styles.transferCountdown}
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Seconds left to transfer values, ${transferSecsLeft}`}
            >
              {transferSecsLeft}s left — copy these numbers; live estimates can change as the 5s
              sample window shifts.
            </Text>
            <Text style={styles.transferBody}>
              Copied into the coursework fields below. These values stay on screen until the timer
              ends.
            </Text>
            <Text style={styles.transferNumbers}>
              Δv (m/s): {frozenImpulse.deltaVMps.toFixed(3)}
              {'\n'}
              Contact (s): {frozenImpulse.contactTimeS.toFixed(3)}
              {'\n'}
              Peak |a| (m/s²): {fmtOpt(frozenImpulse.peakMagnitudeMs2, 1)}
              {'\n'}
              Ref. g-force: {frozenImpulse.referenceG.toFixed(2)}g
            </Text>
          </View>
        ) : null}

        {useDmStream && dm.lastUsedGravityFallback ? (
          <Text style={styles.meta}>
            Using gravity subtraction fallback — linear accel approximate when device reports user
            acceleration as null.
          </Text>
        ) : null}

        <StatReadout label="Calculated g-force (no bounce)" value={`${gManual.toFixed(2)}g`} />

        <FormField
          label="Impact speed (m/s) — coursework / overrides"
          value={impact}
          onChangeText={setImpact}
          keyboardType="decimal-pad"
          accessibilityLabel="Impact speed in meters per second"
        />
        <FormField
          label="Contact time (s) — coursework / overrides"
          value={contact}
          onChangeText={setContact}
          keyboardType="decimal-pad"
          accessibilityLabel="Contact time in seconds"
        />
        <View style={styles.actions}>
          <Button title="Save result" onPress={save} />
          <Button title="Home" variant="secondary" onPress={() => router.back()} />
        </View>
      </ActivityCard>
    </ExperimentScreen>
  );
}

function fmtOpt(n: number | null, decimals: number): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(decimals);
}

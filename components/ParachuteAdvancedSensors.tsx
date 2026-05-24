import { useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { useAccelerometer } from '../hooks/useAccelerometer';
import { useDeviceMotionLinearAccel } from '../hooks/useDeviceMotionLinearAccel';
import { estimateImpactImpulse } from '../lib/calc/impactImpulse';
import type { AccelTimelineSample } from '../lib/calc/impactImpulse';
import { gForceNoBounce, parsePositive } from '../lib/calc/parachuteCalc';
import { activityScreenStyles } from '../theme/activityScreenStyles';
import { useThemedStyles } from '../theme/themedStyles';
import { Button } from './Button';
import { LinearAccelCharts } from './LinearAccelCharts';
import { StatReadout } from './StatReadout';

const TRANSFER_WINDOW_SEC = 10;

type FrozenImpulseSnapshot = {
  deltaVMps: number;
  contactTimeS: number;
  peakMagnitudeMs2: number | null;
  referenceG: number;
  filledFallTimeS: string | null;
};

export type SensorImpulseFill = {
  contactTimeS: string;
  impactSpeedMps: string;
  referenceG: number | null;
};

type ParachuteAdvancedSensorsProps = {
  onApplyEstimate: (estimate: SensorImpulseFill) => void;
  /** Used to derive fall time when drop height is set (v ≈ h / t). */
  dropHeightM?: string;
  /** Existing stopwatch value — kept when already set. */
  recordedFallTimeS?: string;
};

function fmtOpt(n: number | null, decimals: number): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(decimals);
}

export function ParachuteAdvancedSensors({
  onApplyEstimate,
  dropHeightM = '',
  recordedFallTimeS = '',
}: ParachuteAdvancedSensorsProps) {
  const dm = useDeviceMotionLinearAccel();
  const accelRaw = useAccelerometer();
  const useDmStream = !dm.motionDenied && dm.available === true;

  const plotX = useDmStream ? dm.x : accelRaw.x;
  const plotY = useDmStream ? dm.y : accelRaw.y;
  const plotZ = useDmStream ? dm.z : accelRaw.z;
  const plotMagLive = useDmStream ? dm.magnitude : accelRaw.magnitude;
  const impulseSamples: AccelTimelineSample[] = useDmStream ? dm.buffer : accelRaw.buffer;
  const impulse = useMemo(() => estimateImpactImpulse(impulseSamples), [impulseSamples]);

  const [transferSecsLeft, setTransferSecsLeft] = useState(0);
  const [frozenImpulse, setFrozenImpulse] = useState<FrozenImpulseSnapshot | null>(null);
  const transferTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
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
    transferNumbers: {
      fontSize: t.typography.body,
      fontWeight: '600' as const,
      color: t.colors.text,
      lineHeight: 22,
    },
  }));

  const clearTransferTicker = () => {
    if (transferTickRef.current != null) {
      clearInterval(transferTickRef.current);
      transferTickRef.current = null;
    }
  };

  const gFromImpulse =
    impulse.deltaVMps != null && impulse.contactTimeS != null && impulse.contactTimeS > 0
      ? gForceNoBounce(impulse.deltaVMps, impulse.contactTimeS)
      : null;

  const applyEstimate = () => {
    const dv = impulse.deltaVMps;
    const ct = impulse.contactTimeS;
    if (dv != null && ct != null && ct > 0) {
      const contactTimeS = ct.toFixed(3);
      const impactSpeedMps = dv.toFixed(2);
      const refG = gForceNoBounce(dv, ct);

      const height = parsePositive(dropHeightM);
      const hasStopwatch = parsePositive(recordedFallTimeS) != null;
      const filledFallTimeS =
        !hasStopwatch && height != null && dv > 0 ? (height / dv).toFixed(2) : null;

      onApplyEstimate({
        contactTimeS,
        impactSpeedMps,
        referenceG: refG,
      });

      setFrozenImpulse({
        deltaVMps: dv,
        contactTimeS: ct,
        peakMagnitudeMs2: impulse.peakMagnitudeMs2,
        referenceG: refG ?? 0,
        filledFallTimeS,
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

  return (
    <>
      {!useDmStream ? (
        <Text style={styles.p}>
          Charts show raw accelerometer until DeviceMotion is available.
          {dm.motionDenied ? ' Motion permission denied.' : ''}
        </Text>
      ) : null}
      <LinearAccelCharts x={plotX} y={plotY} z={plotZ} />
      <StatReadout
        label="Sensor rate (Hz)"
        value={(useDmStream ? dm.hz : accelRaw.hz).toFixed(0)}
      />
      <StatReadout label="Live |a|" value={plotMagLive.toFixed(2)} />
      <StatReadout label="Δv est. (m/s)" value={fmtOpt(impulse.deltaVMps, 3)} />
      <StatReadout label="Contact est. (s)" value={fmtOpt(impulse.contactTimeS, 3)} />
      <StatReadout label="Peak |a| (m/s²)" value={fmtOpt(impulse.peakMagnitudeMs2, 1)} />
      <StatReadout
        label="g-force reference"
        value={gFromImpulse != null ? `${gFromImpulse.toFixed(2)} g` : '—'}
      />
      <Button
        title="Fill from sensor estimate"
        variant="secondary"
        onPress={applyEstimate}
        disabled={!canApply}
      />
      <Text style={styles.p}>
        Fills contact time automatically. Also fills recorded fall time from drop height and Δv when
        the stopwatch field is empty — you can still edit any field afterward.
      </Text>
      {frozenImpulse !== null && transferSecsLeft > 0 ? (
        <View style={styles.transferBanner}>
          <Text style={styles.transferTitle}>Captured from sensor</Text>
          <Text style={styles.transferCountdown}>{transferSecsLeft}s left</Text>
          <Text style={styles.transferNumbers}>
            Contact time: {frozenImpulse.contactTimeS.toFixed(3)} s{'\n'}
            Impact Δv: {frozenImpulse.deltaVMps.toFixed(3)} m/s{'\n'}
            {frozenImpulse.filledFallTimeS
              ? `Fall time (from height): ${frozenImpulse.filledFallTimeS} s\n`
              : ''}
            Ref. g: {frozenImpulse.referenceG.toFixed(2)} g
          </Text>
        </View>
      ) : null}
    </>
  );
}

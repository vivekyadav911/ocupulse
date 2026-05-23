import { Video, type AVPlaybackStatus } from 'expo-av';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import {
  contactTimeFromFrames,
  fmtCalc,
  gForceBounce,
  gForceForPath,
  gForceNoBounce,
  gForceRisk,
  parsePositive,
  SLOW_MO_FPS,
  vUpFromTime,
} from '../lib/calc/parachuteCalc';
import type { GForcePath } from '../lib/parachute/challengeState';
import { normalizeClipUri } from '../lib/camera/normalizeClipUri';
import { activityScreenStyles } from '../theme/activityScreenStyles';
import { useAppTheme } from '../theme/useAppTheme';
import { useThemedStyles } from '../theme/themedStyles';
import { Button } from './Button';
import { FormField } from './FormField';
import { StatReadout } from './StatReadout';

const FRAME_MS = 1000 / SLOW_MO_FPS;

export type ParachuteSlowMotionReviewProps = {
  videoUri: string;
  impactSpeedMps: number | null;
  firstContactFrame: number | null;
  stoppedFrame: number | null;
  currentFrame: number;
  gForcePath: GForcePath;
  tUpS: string;
  contactTimeS: string;
  primaryMode: boolean;
  onFrameChange: (frame: number) => void;
  onMarkFirstContact: (frame: number) => void;
  onMarkStopped: (frame: number) => void;
  onGForcePathChange: (path: GForcePath) => void;
  onTUpChange: (value: string) => void;
  onContactTimeChange: (value: string) => void;
  onContactTimeFromVideo: (value: string) => void;
};

export function ParachuteSlowMotionReview({
  videoUri,
  impactSpeedMps,
  firstContactFrame,
  stoppedFrame,
  currentFrame,
  gForcePath,
  tUpS,
  contactTimeS,
  primaryMode,
  onFrameChange,
  onMarkFirstContact,
  onMarkStopped,
  onGForcePathChange,
  onTUpChange,
  onContactTimeChange,
  onContactTimeFromVideo,
}: ParachuteSlowMotionReviewProps) {
  const { colors } = useAppTheme();
  const videoRef = useRef<Video>(null);
  const [totalFrames, setTotalFrames] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const styles = useThemedStyles((t) => ({
    ...activityScreenStyles(t),
    videoWrap: {
      height: 220,
      borderRadius: t.radii.md,
      overflow: 'hidden' as const,
      marginBottom: t.spacing.sm,
      backgroundColor: t.colors.readoutBg,
      position: 'relative' as const,
    },
    video: { flex: 1 },
    rulerLabel: {
      position: 'absolute' as const,
      bottom: 28,
      left: t.spacing.sm,
      fontSize: t.typography.caption,
      color: t.colors.textInverse,
      backgroundColor: 'rgba(0,0,0,0.45)',
      paddingHorizontal: t.spacing.xs,
      borderRadius: t.radii.sm,
    },
    frameMeta: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      marginBottom: t.spacing.sm,
    },
    frameRow: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    timeline: {
      height: 8,
      borderRadius: 4,
      backgroundColor: t.colors.border,
      marginBottom: t.spacing.md,
      position: 'relative' as const,
    },
    timelineDot: {
      position: 'absolute' as const,
      top: -2,
      width: 12,
      height: 12,
      borderRadius: 6,
      marginLeft: -6,
    },
    pathToggle: {
      flexDirection: 'row' as const,
      marginBottom: t.spacing.sm,
      gap: t.spacing.sm,
    },
    pathChip: {
      flex: 1,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radii.md,
      borderWidth: 1,
      alignItems: 'center' as const,
    },
    pathChipOn: {
      borderWidth: 2,
    },
    pathColRow: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    pathCol: {
      flex: 1,
      borderWidth: 1,
      borderRadius: t.radii.md,
      padding: t.spacing.sm,
    },
    pathColActive: {
      borderWidth: 2,
    },
    pathColMuted: {
      opacity: 0.55,
    },
    pathTitle: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
      marginBottom: t.spacing.xs,
      textTransform: 'uppercase' as const,
    },
    pathValue: {
      fontSize: t.typography.body,
      fontWeight: '600' as const,
      color: t.colors.text,
    },
  }));

  const onPlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      const dur = status.durationMillis ?? 0;
      if (dur > 0 && dur !== durationMs) {
        setDurationMs(dur);
        setTotalFrames(Math.max(1, Math.floor((dur / 1000) * SLOW_MO_FPS)));
      }
    },
    [durationMs],
  );

  const seekToFrame = useCallback(
    async (frame: number) => {
      const clamped = Math.max(0, Math.min(frame, Math.max(totalFrames - 1, 0)));
      onFrameChange(clamped);
      await videoRef.current?.setPositionAsync(clamped * FRAME_MS);
    },
    [onFrameChange, totalFrames],
  );

  const stepFrame = (delta: number) => {
    void seekToFrame(currentFrame + delta);
  };

  const markFirst = () => {
    onMarkFirstContact(currentFrame);
    if (stoppedFrame != null && stoppedFrame > currentFrame) {
      const ct = contactTimeFromFrames(currentFrame, stoppedFrame);
      if (ct != null) onContactTimeFromVideo(ct.toFixed(2));
    }
  };

  const markStopped = () => {
    onMarkStopped(currentFrame);
    if (firstContactFrame != null && currentFrame > firstContactFrame) {
      const ct = contactTimeFromFrames(firstContactFrame, currentFrame);
      if (ct != null) onContactTimeFromVideo(ct.toFixed(2));
    }
  };

  const contact = parsePositive(contactTimeS);
  const tUp = parsePositive(tUpS);

  const noBounceG = useMemo(() => {
    if (impactSpeedMps == null || contact == null) return null;
    return gForceNoBounce(impactSpeedMps, contact);
  }, [impactSpeedMps, contact]);

  const bounceG = useMemo(() => {
    if (impactSpeedMps == null || contact == null || tUp == null) return null;
    const vUp = vUpFromTime(tUp);
    return vUp != null ? gForceBounce(impactSpeedMps, vUp, contact) : null;
  }, [impactSpeedMps, contact, tUp]);

  const activeG = gForceForPath(impactSpeedMps, contact, gForcePath, tUp);

  const framePct = (frame: number | null) => {
    if (frame == null || totalFrames <= 1) return 0;
    return (frame / (totalFrames - 1)) * 100;
  };

  return (
    <View>
      <View style={styles.videoWrap}>
        <Video
          ref={videoRef}
          source={{ uri: normalizeClipUri(videoUri) }}
          style={styles.video}
          resizeMode="contain"
          shouldPlay={false}
          isLooping={false}
          onPlaybackStatusUpdate={onPlaybackStatus}
        />
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <RulerOverlay />
        </View>
        <Text style={styles.rulerLabel} pointerEvents="none">
          Scale reference — align to drop zone
        </Text>
      </View>

      <Text style={styles.frameMeta}>
        Frame {currentFrame + 1} / {Math.max(totalFrames, 1)} ·{' '}
        {((currentFrame / SLOW_MO_FPS) * 1000).toFixed(0)} ms
      </Text>

      <View style={styles.frameRow}>
        <Button title="◀ 1 frame" variant="secondary" onPress={() => stepFrame(-1)} />
        <Button title="▶ 1 frame" variant="secondary" onPress={() => stepFrame(1)} />
      </View>

      <View style={styles.frameRow}>
        <Button title="Mark first contact" variant="accent" onPress={markFirst} />
        <Button title="Mark stopped moving" variant="accent" onPress={markStopped} />
      </View>

      <View style={styles.timeline}>
        {firstContactFrame != null ? (
          <View
            style={[
              styles.timelineDot,
              { left: `${framePct(firstContactFrame)}%`, backgroundColor: colors.accent },
            ]}
          />
        ) : null}
        {stoppedFrame != null ? (
          <View
            style={[
              styles.timelineDot,
              {
                left: `${framePct(stoppedFrame)}%`,
                backgroundColor: '#4ade80',
              },
            ]}
          />
        ) : null}
      </View>

      <FormField
        label="Contact time (s)"
        value={contactTimeS}
        onChangeText={onContactTimeChange}
        keyboardType="decimal-pad"
      />

      {!primaryMode ? (
        <>
          <View style={styles.pathToggle}>
            {(['noBounce', 'bounce'] as GForcePath[]).map((path) => {
              const on = gForcePath === path;
              return (
                <Pressable
                  key={path}
                  style={[
                    styles.pathChip,
                    {
                      borderColor: on ? colors.accent : colors.border,
                      backgroundColor: on ? colors.accent : 'transparent',
                    },
                    on && styles.pathChipOn,
                  ]}
                  onPress={() => onGForcePathChange(path)}
                >
                  <Text
                    style={{
                      fontWeight: '700',
                      color: on ? colors.textInverse : colors.text,
                    }}
                  >
                    {path === 'noBounce' ? 'No bounce' : 'Bounce'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.pathColRow}>
            <View
              style={[
                styles.pathCol,
                { borderColor: colors.border },
                gForcePath === 'noBounce'
                  ? [styles.pathColActive, { borderColor: colors.accent }]
                  : styles.pathColMuted,
              ]}
            >
              <Text style={[styles.pathTitle, { color: colors.accent }]}>No bounce</Text>
              <Text style={styles.pathValue}>v = {fmtCalc(impactSpeedMps)} m/s</Text>
              <Text style={styles.pathValue}>t = {fmtCalc(contact, 2)} s</Text>
              <Text style={styles.pathValue}>g = {fmtCalc(noBounceG, 2)}</Text>
            </View>
            <View
              style={[
                styles.pathCol,
                { borderColor: colors.border },
                gForcePath === 'bounce'
                  ? [styles.pathColActive, { borderColor: colors.accent }]
                  : styles.pathColMuted,
              ]}
            >
              <Text style={[styles.pathTitle, { color: colors.accent }]}>Bounce</Text>
              <FormField
                label="tUp (s)"
                value={tUpS}
                onChangeText={onTUpChange}
                keyboardType="decimal-pad"
              />
              <Text style={styles.pathValue}>
                vUp = {fmtCalc(tUp != null ? vUpFromTime(tUp) : null)} m/s
              </Text>
              <Text style={styles.pathValue}>g = {fmtCalc(bounceG, 2)}</Text>
            </View>
          </View>

          <StatReadout
            label={`Final g-force (${gForcePath === 'noBounce' ? 'no bounce' : 'bounce'})`}
            value={
              activeG.gForce != null
                ? `${fmtCalc(activeG.gForce, 2)} g · ${gForceRisk(activeG.gForce)}`
                : '—'
            }
          />
        </>
      ) : null}
    </View>
  );
}

function RulerOverlay() {
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const x = 20 + i * 28;
    const major = i % 10 === 0;
    ticks.push(
      <Line
        key={i}
        x1={x}
        y1={major ? 8 : 16}
        x2={x}
        y2={32}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={major ? 2 : 1}
      />,
    );
  }
  return (
    <Svg height={40} width="100%" viewBox="0 0 320 40">
      <Rect x={0} y={0} width={320} height={40} fill="rgba(0,0,0,0.35)" />
      {ticks}
      <SvgText x={160} y={8} fill="rgba(255,255,255,0.7)" fontSize={8} textAnchor="middle">
        10 cm
      </SvgText>
    </Svg>
  );
}

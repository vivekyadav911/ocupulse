import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { randomReactionDelayMs } from '../../lib/calc/reactionStats';
import { Button } from '../Button';
import { StatReadout } from '../StatReadout';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

const BUTTON_SIZE = 80;

export type TapResult = {
  appearTs: number;
  tapTs: number;
  reactionMs: number;
};

type ReactionTapPanelProps = {
  onContinue: (best: TapResult) => void;
  disabled?: boolean;
  autoStart?: boolean;
  attemptKey?: number;
};

type TapPhase = 'idle' | 'waiting' | 'ready' | 'tooEarly' | 'done';

export function ReactionTapPanel({
  onContinue,
  disabled,
  autoStart,
  attemptKey = 0,
}: ReactionTapPanelProps) {
  const { colors } = useAppTheme();
  const [tapPhase, setTapPhase] = useState<TapPhase>('idle');
  const [lastResult, setLastResult] = useState<TapResult | null>(null);
  const [bestResult, setBestResult] = useState<TapResult | null>(null);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [areaSize, setAreaSize] = useState({ w: 300, h: 320 });

  const appearTsRef = useRef(0);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonColorRef = useRef(colors.accent);
  const areaSizeRef = useRef({ w: 0, h: 0 });
  const [layoutReady, setLayoutReady] = useState(false);

  const styles = useThemedStyles((t) => ({
    area: {
      height: 320,
      borderWidth: 2,
      borderColor: t.colors.border,
      borderRadius: t.radii.lg,
      backgroundColor: t.colors.readoutBg,
      marginVertical: t.spacing.md,
      overflow: 'hidden' as const,
      position: 'relative' as const,
    },
    message: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: t.colors.text,
      textAlign: 'center' as const,
      marginTop: t.spacing.xl * 3,
    },
    tooEarly: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: t.colors.danger ?? '#e53935',
      textAlign: 'center' as const,
      marginTop: t.spacing.xl * 3,
    },
    result: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: t.colors.accent,
      textAlign: 'center' as const,
      marginTop: t.spacing.xl * 2,
    },
    tapButton: {
      position: 'absolute' as const,
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: BUTTON_SIZE / 2,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    tapButtonText: {
      color: '#fff',
      fontWeight: '800' as const,
      fontSize: 16,
    },
    actions: {
      gap: t.spacing.sm,
      marginTop: t.spacing.sm,
    },
  }));

  useEffect(() => {
    setTapPhase('idle');
    setLastResult(null);
    setBestResult(null);
  }, [attemptKey]);

  const clearDelayTimer = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearDelayTimer(), [clearDelayTimer]);

  const pickRandomPosition = useCallback(() => {
    const { w, h } = areaSizeRef.current;
    if (w <= 0 || h <= 0) return;
    const maxX = Math.max(0, w - BUTTON_SIZE);
    const maxY = Math.max(0, h - BUTTON_SIZE);
    setButtonPos({
      x: Math.floor(Math.random() * (maxX + 1)),
      y: Math.floor(Math.random() * (maxY + 1)),
    });
  }, []);

  const armRound = useCallback(() => {
    clearDelayTimer();
    setLastResult(null);
    setTapPhase('waiting');
    delayTimerRef.current = setTimeout(() => {
      if (areaSizeRef.current.w <= 0 || areaSizeRef.current.h <= 0) return;
      pickRandomPosition();
      const palette = [colors.accent, '#4caf50', '#ff9800', '#9c27b0', '#2196f3'];
      buttonColorRef.current = palette[Math.floor(Math.random() * palette.length)]!;
      appearTsRef.current = Date.now();
      setTapPhase('ready');
    }, randomReactionDelayMs());
  }, [clearDelayTimer, colors.accent, pickRandomPosition]);

  const handleEarlyTap = useCallback(() => {
    if (tapPhase !== 'waiting') return;
    clearDelayTimer();
    setTapPhase('tooEarly');
  }, [clearDelayTimer, tapPhase]);

  const handleButtonTap = useCallback(() => {
    if (tapPhase !== 'ready') return;
    const tapTs = Date.now();
    const appearTs = appearTsRef.current;
    const tapResult: TapResult = {
      appearTs,
      tapTs,
      reactionMs: tapTs - appearTs,
    };
    setLastResult(tapResult);
    setBestResult((prev) =>
      prev == null || tapResult.reactionMs < prev.reactionMs ? tapResult : prev,
    );
    setTapPhase('done');
  }, [tapPhase]);

  const onAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      areaSizeRef.current = { w: width, h: height };
      setAreaSize({ w: width, h: height });
      setLayoutReady(true);
    }
  };

  useEffect(() => {
    if (autoStart && tapPhase === 'idle' && !disabled && layoutReady) {
      armRound();
    }
  }, [autoStart, armRound, disabled, tapPhase, layoutReady, attemptKey]);

  const clampedLeft = Math.min(buttonPos.x, Math.max(0, areaSize.w - BUTTON_SIZE));
  const clampedTop = Math.min(buttonPos.y, Math.max(0, areaSize.h - BUTTON_SIZE));

  return (
    <View>
      <View style={styles.area} onLayout={onAreaLayout}>
        {tapPhase === 'waiting' ? (
          <Pressable style={{ flex: 1 }} onPress={handleEarlyTap}>
            <Text style={styles.message}>Get ready…</Text>
          </Pressable>
        ) : null}

        {tapPhase === 'tooEarly' ? (
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.tooEarly}>Too early! Try again.</Text>
            <Button title="Try again" onPress={armRound} style={{ marginTop: 24 }} />
          </View>
        ) : null}

        {tapPhase === 'ready' ? (
          <Pressable
            style={[
              styles.tapButton,
              {
                left: clampedLeft,
                top: clampedTop,
                backgroundColor: buttonColorRef.current,
              },
            ]}
            onPress={handleButtonTap}
          >
            <Text style={styles.tapButtonText}>TAP!</Text>
          </Pressable>
        ) : null}

        {tapPhase === 'done' && lastResult ? (
          <View style={{ flex: 1, alignItems: 'center', paddingTop: 48 }}>
            <Text style={styles.result}>This try: {lastResult.reactionMs} ms</Text>
            {bestResult ? (
              <Text style={[styles.result, { marginTop: 8 }]}>
                Best: {bestResult.reactionMs} ms
              </Text>
            ) : null}
          </View>
        ) : null}

        {tapPhase === 'idle' ? <Text style={styles.message}>Press Start when ready</Text> : null}
      </View>

      {tapPhase === 'idle' ? <Button title="Start" onPress={armRound} disabled={disabled} /> : null}

      {tapPhase === 'done' && bestResult ? (
        <View style={styles.actions}>
          <StatReadout label="Best reaction time" value={`${bestResult.reactionMs} ms`} />
          <Button title="Retry" variant="secondary" onPress={armRound} />
          <Button title="Continue with best" onPress={() => onContinue(bestResult)} />
        </View>
      ) : null}
    </View>
  );
}

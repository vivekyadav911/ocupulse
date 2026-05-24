import { useCallback, useEffect, useRef, useState } from 'react';
import { impactGFromMagnitudes } from '../lib/calc/parachuteImpact';
import { useAccelerometer } from './useAccelerometer';

const DROP_MS = 5000;

export function useParachuteDrop() {
  const { magnitude } = useAccelerometer();
  const [phase, setPhase] = useState<'idle' | 'recording' | 'done'>('idle');
  const [impactG, setImpactG] = useState(0);
  const [livePeakG, setLivePeakG] = useState(0);
  const samplesRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase !== 'recording') return;
    samplesRef.current.push(magnitude);
    const ig = impactGFromMagnitudes(samplesRef.current);
    setLivePeakG(ig);
  }, [magnitude, phase]);

  const finish = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const ig = impactGFromMagnitudes(samplesRef.current);
    setImpactG(ig);
    setLivePeakG(ig);
    setPhase('done');
  }, []);

  const startDrop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    samplesRef.current = [];
    setImpactG(0);
    setLivePeakG(0);
    setPhase('recording');
    timerRef.current = setTimeout(finish, DROP_MS);
  }, [finish]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    samplesRef.current = [];
    setImpactG(0);
    setLivePeakG(0);
    setPhase('idle');
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const safetyScoreFromImpact = (g: number) => Math.max(0, Math.round(100 - g * 10));

  return {
    phase,
    impactG,
    livePeakG,
    dropMs: DROP_MS,
    startDrop,
    finish,
    reset,
    safetyScoreFromImpact,
    sampleCount: samplesRef.current.length,
  };
}

import { Video, type AVPlaybackStatus } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isLoadedPlaybackStatus,
  safePause,
  safePlay,
  safeSetPosition,
} from '../lib/camera/safeAvPlayback';

type UseSlowMotionVideoPlayerOptions = {
  uri: string;
  fps: number;
  onFrameChange: (frame: number) => void;
};

export function useSlowMotionVideoPlayer({
  uri,
  fps,
  onFrameChange,
}: UseSlowMotionVideoPlayerOptions) {
  const videoRef = useRef<Video>(null);
  const frameSec = 1 / fps;

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);

  const isScrubbingRef = useRef(false);
  const maxFrameRef = useRef(0);
  const lastSeekAtRef = useRef(0);
  const pendingSeekFrameRef = useRef<number | null>(null);
  const seekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationMsRef = useRef(0);
  const isReadyRef = useRef(false);
  const isPlayingRef = useRef(false);
  const lastFrameRef = useRef(-1);
  const onFrameChangeRef = useRef(onFrameChange);
  onFrameChangeRef.current = onFrameChange;

  const maxFrame = Math.max(totalFrames - 1, 0);
  maxFrameRef.current = maxFrame;

  const applyDuration = useCallback(
    (durMs: number) => {
      if (!Number.isFinite(durMs) || durMs <= 0 || durMs === durationMsRef.current) return;
      durationMsRef.current = durMs;
      setDurationMs(durMs);
      const frames = Math.max(1, Math.ceil((durMs / 1000) * fps));
      setTotalFrames(frames);
      maxFrameRef.current = Math.max(frames - 1, 0);
    },
    [fps],
  );

  const seekVideoToFrame = useCallback(
    async (frame: number) => {
      const clamped = Math.max(0, Math.min(frame, maxFrameRef.current));
      await safeSetPosition(videoRef.current, clamped * frameSec * 1000);
    },
    [frameSec],
  );

  const flushSeek = useCallback(async () => {
    const frame = pendingSeekFrameRef.current;
    if (frame == null) return;
    pendingSeekFrameRef.current = null;
    await seekVideoToFrame(frame);
  }, [seekVideoToFrame]);

  const scheduleSeek = useCallback(
    (frame: number, immediate = false) => {
      const clamped = Math.max(0, Math.min(frame, maxFrameRef.current));
      pendingSeekFrameRef.current = clamped;
      lastFrameRef.current = clamped;
      onFrameChangeRef.current(clamped);

      if (seekTimerRef.current) {
        clearTimeout(seekTimerRef.current);
        seekTimerRef.current = null;
      }

      if (immediate) {
        void flushSeek();
        return;
      }

      const elapsed = Date.now() - lastSeekAtRef.current;
      const delay = elapsed < 50 ? 50 - elapsed : 0;
      seekTimerRef.current = setTimeout(() => {
        seekTimerRef.current = null;
        lastSeekAtRef.current = Date.now();
        void flushSeek();
      }, delay);
    },
    [flushSeek],
  );

  const onPlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!isLoadedPlaybackStatus(status)) return;

      applyDuration(status.durationMillis ?? 0);

      const durMs = status.durationMillis ?? 0;
      if (!isReadyRef.current && durMs > 0) {
        isReadyRef.current = true;
        setIsReady(true);
      }

      const playing = status.isPlaying;
      if (playing !== isPlayingRef.current) {
        isPlayingRef.current = playing;
        setIsPlaying(playing);
      }

      if (playing && !isScrubbingRef.current) {
        const frame = Math.round((status.positionMillis ?? 0) / (frameSec * 1000));
        const clamped = Math.max(0, Math.min(frame, maxFrameRef.current));
        if (clamped !== lastFrameRef.current) {
          lastFrameRef.current = clamped;
          onFrameChangeRef.current(clamped);
        }
      }

      if (status.didJustFinish && isPlayingRef.current) {
        isPlayingRef.current = false;
        setIsPlaying(false);
      }
    },
    [applyDuration, frameSec],
  );

  const pause = useCallback(async () => {
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
    await safePause(videoRef.current);
  }, []);

  const play = useCallback(async () => {
    if (!isReadyRef.current) return;
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
    await safePlay(videoRef.current);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (isPlayingRef.current) await pause();
    else await play();
  }, [pause, play]);

  const beginScrub = useCallback(() => {
    isScrubbingRef.current = true;
    void pause();
  }, [pause]);

  const endScrub = useCallback(
    (frame: number) => {
      isScrubbingRef.current = false;
      scheduleSeek(frame, true);
    },
    [scheduleSeek],
  );

  const scrubToFrame = useCallback(
    (frame: number) => {
      scheduleSeek(frame, false);
    },
    [scheduleSeek],
  );

  const stepFrame = useCallback(
    async (currentFrame: number, delta: number) => {
      await pause();
      scheduleSeek(currentFrame + delta, true);
    },
    [pause, scheduleSeek],
  );

  useEffect(() => {
    isReadyRef.current = false;
    isPlayingRef.current = false;
    durationMsRef.current = 0;
    lastFrameRef.current = -1;
    setIsReady(false);
    setIsPlaying(false);
    setDurationMs(0);
    setTotalFrames(0);
    pendingSeekFrameRef.current = null;
    lastSeekAtRef.current = 0;
  }, [uri]);

  useEffect(() => {
    return () => {
      if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    };
  }, []);

  return {
    videoRef,
    isReady,
    isPlaying,
    durationMs,
    totalFrames,
    maxFrame,
    onPlaybackStatus,
    togglePlayPause,
    beginScrub,
    endScrub,
    scrubToFrame,
    stepFrame,
    pause,
  };
}

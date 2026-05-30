import { act, renderHook } from '@testing-library/react-native';
import { useSlowMotionVideoPlayer } from '../useSlowMotionVideoPlayer';

jest.mock('../../lib/camera/safeAvPlayback', () => ({
  isLoadedPlaybackStatus: (status: { isLoaded?: boolean }) => Boolean(status.isLoaded),
  safePause: jest.fn(() => Promise.resolve()),
  safePlay: jest.fn(() => Promise.resolve()),
  safeSetPosition: jest.fn(() => Promise.resolve()),
}));

describe('useSlowMotionVideoPlayer', () => {
  it('updates currentFrame during playback without notifying parent every tick', () => {
    const onFrameChange = jest.fn();
    const { result } = renderHook(() =>
      useSlowMotionVideoPlayer({
        uri: 'file:///clip.mov',
        fps: 30,
        onFrameChange,
      }),
    );

    act(() => {
      result.current.onPlaybackStatus({
        isLoaded: true,
        durationMillis: 3000,
        isPlaying: true,
        positionMillis: 0,
      });
    });

    expect(result.current.currentFrame).toBe(0);
    expect(onFrameChange).not.toHaveBeenCalled();

    act(() => {
      result.current.onPlaybackStatus({
        isLoaded: true,
        durationMillis: 3000,
        isPlaying: true,
        positionMillis: 1000,
      });
    });

    expect(result.current.currentFrame).toBe(30);
    expect(onFrameChange).not.toHaveBeenCalled();
  });

  it('notifies parent when scrubbing ends', async () => {
    const onFrameChange = jest.fn();
    const { result } = renderHook(() =>
      useSlowMotionVideoPlayer({
        uri: 'file:///clip.mov',
        fps: 30,
        onFrameChange,
      }),
    );

    act(() => {
      result.current.onPlaybackStatus({
        isLoaded: true,
        durationMillis: 3000,
        isPlaying: false,
        positionMillis: 0,
      });
      result.current.endScrub(12);
    });

    expect(onFrameChange).toHaveBeenCalledWith(12);
    expect(result.current.currentFrame).toBe(12);
  });

  it('notifies parent when pausing playback', async () => {
    const onFrameChange = jest.fn();
    const { result } = renderHook(() =>
      useSlowMotionVideoPlayer({
        uri: 'file:///clip.mov',
        fps: 30,
        onFrameChange,
      }),
    );

    act(() => {
      result.current.onPlaybackStatus({
        isLoaded: true,
        durationMillis: 3000,
        isPlaying: true,
        positionMillis: 500,
      });
    });

    onFrameChange.mockClear();

    await act(async () => {
      await result.current.pause();
    });

    expect(onFrameChange).toHaveBeenCalledWith(15);
  });
});

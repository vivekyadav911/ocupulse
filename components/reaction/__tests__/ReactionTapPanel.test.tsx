import { act, fireEvent, screen } from '@testing-library/react-native';
import { ReactionTapPanel } from '../ReactionTapPanel';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';

jest.mock('../../../lib/calc/reactionStats', () => {
  const actual = jest.requireActual('../../../lib/calc/reactionStats');
  return {
    ...actual,
    randomReactionDelayMs: jest.fn(() => 120),
  };
});

describe('ReactionTapPanel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs start -> ready -> tap -> continue with best', () => {
    const onContinue = jest.fn();
    renderWithProviders(<ReactionTapPanel onContinue={onContinue} />);

    const idleMessage = screen.getByText('Press Start when ready');
    fireEvent(idleMessage.parent, 'layout', {
      nativeEvent: { layout: { width: 300, height: 320 } },
    });

    fireEvent.press(screen.getByText('Start'));
    expect(screen.getByText('Get ready…')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(120);
    });

    expect(screen.getByText('TAP!')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(180);
    });
    fireEvent.press(screen.getByText('TAP!'));

    expect(screen.getByText('This try: 180 ms')).toBeTruthy();
    expect(screen.getByText('Best: 180 ms')).toBeTruthy();

    fireEvent.press(screen.getByText('Continue with best'));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onContinue.mock.calls[0]?.[0]).toMatchObject({ reactionMs: 180 });
  });
});

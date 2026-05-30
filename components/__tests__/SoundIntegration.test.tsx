import { Text, View } from 'react-native';
import { screen } from '@testing-library/react-native';
import { SoundDbGauge } from '../SoundDbGauge';
import { SoundResultsTable } from '../SoundResultsTable';
import { SoundSummaryCard } from '../SoundSummaryCard';
import type { SoundCapture } from '../../lib/sound/sessionState';
import { summarizeSoundSession } from '../../lib/sound/sessionState';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const captures: SoundCapture[] = [
  {
    id: 'capture-1',
    actionLabel: 'Class clap',
    prediction: null,
    peakDb: 72,
    lat: -33.86,
    lng: 151.21,
    capturedAt: '2026-05-25T08:00:00.000Z',
    predictionCorrect: null,
  },
  {
    id: 'capture-2',
    actionLabel: 'Whistle',
    prediction: 'louder',
    peakDb: 96,
    lat: -33.86,
    lng: 151.21,
    capturedAt: '2026-05-25T08:01:00.000Z',
    predictionCorrect: true,
  },
];

describe('Sound integration components', () => {
  it('shows live dB gauge state with current and peak readouts', () => {
    renderWithProviders(<SoundDbGauge liveDb={92} peakDb={98} recording />);

    expect(screen.getByText('Current')).toBeTruthy();
    expect(screen.getByText('Session peak')).toBeTruthy();
    expect(screen.getByText(/92\s*dB/)).toBeTruthy();
    expect(screen.getByText('98 dB')).toBeTruthy();
    expect(screen.getByText('Live metering active')).toBeTruthy();
  });

  it('renders capture table and ear-protection recommendation from summary', () => {
    const summary = summarizeSoundSession(captures);
    renderWithProviders(
      <View>
        <Text>Integration wrapper</Text>
        <SoundResultsTable captures={captures} />
        <SoundSummaryCard summary={summary} />
      </View>,
    );

    expect(screen.getByText('Captured readings')).toBeTruthy();
    expect(screen.getByText('Class clap')).toBeTruthy();
    expect(screen.getByText('Whistle')).toBeTruthy();
    expect(screen.getByText('Louder than previous')).toBeTruthy();
    expect(screen.getByText('96 dB')).toBeTruthy();
    expect(screen.getByText(/wear ear protection\? Yes/i)).toBeTruthy();
  });
});

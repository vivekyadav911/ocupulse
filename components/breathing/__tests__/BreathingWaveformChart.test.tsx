import { screen } from '@testing-library/react-native';
import { Circle } from 'react-native-svg';
import { BreathingWaveformChart } from '../BreathingWaveformChart';
import type { WaveformPoint } from '../../../lib/breathing/breathingSignal';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';

const samples: WaveformPoint[] = [
  { t: 0, z: 0.98 },
  { t: 500, z: 1.02 },
  { t: 1000, z: 1.05 },
  { t: 1500, z: 1.0 },
  { t: 2000, z: 0.97 },
  { t: 2500, z: 1.03 },
  { t: 3000, z: 1.06 },
];

describe('BreathingWaveformChart', () => {
  it('shows waiting state without enough samples', () => {
    renderWithProviders(<BreathingWaveformChart samples={[]} />);

    expect(screen.getByText('Breathing waveform (last 10 s)')).toBeTruthy();
    expect(screen.getByText('Waiting for sensor data…')).toBeTruthy();
  });

  it('renders waveform and peak markers when data is available', () => {
    renderWithProviders(<BreathingWaveformChart samples={samples} peakTimes={[1000, 3000]} />);

    expect(screen.getByText('Breathing waveform (last 10 s)')).toBeTruthy();
    expect(screen.queryByText('Waiting for sensor data…')).toBeNull();
    expect(screen.UNSAFE_getAllByType(Circle)).toHaveLength(2);
  });
});

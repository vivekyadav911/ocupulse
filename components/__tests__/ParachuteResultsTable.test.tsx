import { fireEvent, screen } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import { ParachuteResultsTable } from '../ParachuteResultsTable';
import type { ChallengeReflection } from '../../lib/parachute/challengeState';
import type { RunSummary } from '../../lib/parachute/runSummary';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const reflection: ChallengeReflection = {
  bestDesign: '',
  easiestDesign: '',
  predictionsCorrect: '',
};

const runs: RunSummary[] = [
  {
    tabKey: 'baseline',
    designName: 'Baseline',
    predictedFallTimeS: 1.2,
    recordedFallTimeS: 1.1,
    finalVelocityMps: 2.8,
    gForce: 4.1,
    riskLabel: 'No injury risk',
    gForcePath: 'noBounce',
  },
  {
    tabKey: 'prototype1',
    designName: 'Prototype 1',
    predictedFallTimeS: 1.5,
    recordedFallTimeS: 1.4,
    finalVelocityMps: 2.1,
    gForce: 3.2,
    riskLabel: 'No injury risk',
    gForcePath: 'noBounce',
  },
];

describe('ParachuteResultsTable', () => {
  it('renders run data and marks the best parachute row', () => {
    const onReflectionChange = jest.fn();
    renderWithProviders(
      <ParachuteResultsTable
        runs={runs}
        reflection={reflection}
        onReflectionChange={onReflectionChange}
      />,
    );

    expect(screen.getByText('Results summary')).toBeTruthy();
    expect(screen.getByText('Prototype 1')).toBeTruthy();
    expect(screen.getByText('2.10')).toBeTruthy();
    expect(screen.getByText('Best parachute')).toBeTruthy();
  });

  it('propagates reflection edits through callbacks', () => {
    const onReflectionChange = jest.fn();
    renderWithProviders(
      <ParachuteResultsTable
        runs={runs}
        reflection={reflection}
        onReflectionChange={onReflectionChange}
      />,
    );

    const inputs = screen.UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0]!, 'Prototype 1 was most stable');

    expect(onReflectionChange).toHaveBeenCalledWith({ bestDesign: 'Prototype 1 was most stable' });
  });
});

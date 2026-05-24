import { FormField } from '../FormField';
import type { EarthquakeDesignRun } from '../../lib/earthquake/sessionState';
import { EarthquakePredictionPicker } from './EarthquakePredictionPicker';

type EarthquakeDesignFormProps = {
  run: EarthquakeDesignRun;
  onChange: (partial: Partial<EarthquakeDesignRun>) => void;
  disabled?: boolean;
};

export function EarthquakeDesignForm({ run, onChange, disabled }: EarthquakeDesignFormProps) {
  return (
    <>
      <FormField
        label="Number of folds"
        value={run.folds}
        onChangeText={(folds) => onChange({ folds })}
        keyboardType="number-pad"
        editable={!disabled}
      />
      <FormField
        label="Number of pillars"
        value={run.pillars}
        onChangeText={(pillars) => onChange({ pillars })}
        keyboardType="number-pad"
        editable={!disabled}
      />
      <FormField
        label="Custom design note"
        value={run.designNote}
        onChangeText={(designNote) => onChange({ designNote })}
        multiline
        editable={!disabled}
      />
      <EarthquakePredictionPicker
        value={run.predictedMovement}
        onChange={(predictedMovement) => onChange({ predictedMovement })}
        disabled={disabled}
      />
    </>
  );
}

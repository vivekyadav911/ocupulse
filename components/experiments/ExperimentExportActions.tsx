import { Button } from '../Button';
import type { ExperimentRecord } from '../../services/experimentsData';
import {
  shareExperimentAsPdf,
  shareExperimentAsText,
} from '../../lib/export/shareExperimentReport';

type ExperimentExportActionsProps = {
  record: ExperimentRecord;
};

export function ExperimentExportActions({ record }: ExperimentExportActionsProps) {
  return (
    <>
      <Button
        title="Share as text"
        variant="accent"
        icon="document-text-outline"
        onPress={() => void shareExperimentAsText(record)}
      />
      <Button
        title="Share as PDF"
        icon="document-outline"
        onPress={() => void shareExperimentAsPdf(record)}
      />
    </>
  );
}

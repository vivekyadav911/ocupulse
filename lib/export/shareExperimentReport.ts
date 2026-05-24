import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Share } from 'react-native';
import type { ExperimentRecord } from '../../services/experimentsData';
import { formatExperimentHtml, formatExperimentText } from './formatExperimentReport';

export async function shareExperimentAsText(record: ExperimentRecord): Promise<void> {
  const message = formatExperimentText(record);
  try {
    await Share.share({ message, title: 'Experiment report' });
  } catch (e) {
    Alert.alert('Share failed', e instanceof Error ? e.message : 'Could not share report.');
  }
}

export async function shareExperimentAsPdf(record: ExperimentRecord): Promise<void> {
  try {
    const html = formatExperimentHtml(record);
    const { uri } = await Print.printToFileAsync({ html });
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('PDF saved', `Report saved to:\n${uri}`);
      return;
    }
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share experiment report',
      UTI: 'com.adobe.pdf',
    });
  } catch (e) {
    Alert.alert('PDF export failed', e instanceof Error ? e.message : 'Could not create PDF.');
  }
}

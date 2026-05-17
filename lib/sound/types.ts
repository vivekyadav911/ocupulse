export type SoundSample = {
  id: string;
  peakDb: number;
  avgDb: number;
  lat: number;
  lng: number;
  address: string;
  teamName?: string;
};

export type SoundSamplePayload = {
  peakDb: number;
  avgDb: number;
  lat: number;
  lng: number;
  address: string;
};

import type { WaveformType } from './waveform';

export type LfoTarget = 'pitch' | 'filter_cutoff' | 'volume';

export interface Lfo {
  type: WaveformType;
  rate: number;
  depth: number;
}
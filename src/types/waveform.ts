
export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface Waveform {
  type: WaveformType;
  frequency: number;
}
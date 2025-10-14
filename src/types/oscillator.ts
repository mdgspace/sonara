import type { WaveformType } from './waveform';

/**
 * Represents a single oscillator, often used when a synth has multiple oscillators.
 */
export interface Oscillator {
  type: WaveformType;
  detune: number;
  volume: number;
}
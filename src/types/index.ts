export * from './envelope';
export * from './eq';
export * from './filter';
export * from './effects';
export * from './oscillator';
export * from './sequencer';
export * from './waveform';

/**
 * Represents the overall state of the synthesizer, combining all modules.
 */
export interface SynthState {
  oscillators: import('./oscillator').Oscillator[];
  octave: number;
  envelope: import('./envelope').Envelope;
  eq: import('./eq').EQBand[];
  filter: import('./filter').Filter;
  lfo: import('./lfo').Lfo;
  waveform: import('./waveform').Waveform;
  effects: {
    delay: import('./effects').Delay;
    reverb: import('./effects').Reverb;
    chorus: import('./effects').Chorus;
    distortion: import('./effects').Distortion;
  };
  sequencer: {
    steps: import('./sequencer').SequencerStep[];
    bpm: number;
  };
  /** The time in seconds for pitch to slide between notes. */
  portamento: number;
  masterVolume: number;
}

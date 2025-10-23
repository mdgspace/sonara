export interface Delay {
  time: number;
  feedback: number;
  mix: number;
}

export interface Reverb {
  preDelay: number;
  decay: number;
  mix: number;
}

export interface Chorus {
  rate: number;
  depth: number;
  mix: number;
}

export interface Distortion {
  amount: number;
  tone: number;
}
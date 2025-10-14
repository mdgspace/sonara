import { notes } from '@/constants/keys.js';

type Note = (typeof notes)[number];

export interface SequencerStep {
  note: Note | null; // The note to play, or null for a rest
  velocity: number;
  isActive: boolean;
}
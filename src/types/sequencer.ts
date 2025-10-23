import { notes } from './keys';

// IAccept only 'C', 'D', 'E', etc., from the 'notes' array.
type Note = (typeof notes)[number];

export interface SequencerStep {
  note: Note | null; // The note to play, or null for a rest
  velocity: number;
  isActive: boolean;
}
import { GuitarTuning } from '../types';

export const STANDARD_TUNINGS: GuitarTuning[] = [
  {
    id: 'standard',
    name: 'Standard (EADGBE)',
    frequencies: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63],
    notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    id: 'drop_d',
    name: 'Drop D (DADGBE)',
    frequencies: [73.42, 110.00, 146.83, 196.00, 246.94, 329.63],
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    id: 'open_g',
    name: 'Open G (DGDGBD)',
    frequencies: [73.42, 98.00, 146.83, 196.00, 246.94, 293.66],
    notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
  },
  {
    id: 'drop_c',
    name: 'Drop C (CADGBE)',
    frequencies: [65.41, 110.00, 146.83, 196.00, 246.94, 329.63],
    notes: ['C2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  {
    id: 'open_d',
    name: 'Open D (DADF#AD)',
    frequencies: [73.42, 110.00, 146.83, 185.00, 220.00, 293.66],
    notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
  },
  {
    id: 'half_step_down',
    name: 'Half Step Down (Eb)',
    frequencies: [77.78, 103.83, 138.59, 185.00, 233.08, 311.13],
    notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
  },
  {
    id: 'full_step_down',
    name: 'Full Step Down (D)',
    frequencies: [73.42, 98.00, 130.81, 174.61, 220.00, 293.66],
    notes: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'],
  },
];

export const NOTE_FREQUENCIES: Record<string, number[]> = {
  C:    [65.41, 130.81, 261.63, 523.25],
  'C#': [69.30, 138.59, 277.18, 554.37],
  D:    [73.42, 146.83, 293.66, 587.33],
  'D#': [77.78, 155.56, 311.13, 622.25],
  E:    [82.41, 164.81, 329.63, 659.25],
  F:    [87.31, 174.61, 349.23, 698.46],
  'F#': [92.50, 185.00, 369.99, 739.99],
  G:    [98.00, 196.00, 392.00, 783.99],
  'G#': [103.83, 207.65, 415.30, 830.61],
  A:    [110.00, 220.00, 440.00, 880.00],
  'A#': [116.54, 233.08, 466.16, 932.33],
  B:    [123.47, 246.94, 493.88, 987.77],
};

export const TUNER_CONFIG = {
  sampleRate: 22050,
  smoothingFactor: 0.8,
  minVolume: 0.005,
  centTolerance: 5,
};

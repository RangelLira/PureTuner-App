import { NOTE_FREQUENCIES } from '../constants/tunings';

export interface PitchDetectionResult {
  note: string;
  frequency: number;
  cents: number;
  isInTune: boolean;
  confidence?: number;
}

export class PitchDetector {
  private centTolerance: number;
  private frequencyHistory: number[] = [];
  private readonly maxHistorySize = 8;

  constructor(centTolerance = 10) {
    this.centTolerance = centTolerance;
  }

  public detectPitch(frequency: number, confidence = 1.0): PitchDetectionResult {
    if (!frequency || frequency <= 0) {
      return { note: '', frequency: 0, cents: 0, isInTune: false, confidence: 0 };
    }

    this.frequencyHistory.push(frequency);
    if (this.frequencyHistory.length > this.maxHistorySize) {
      this.frequencyHistory.shift();
    }

    const smoothedFrequency = this.smoothFrequency(this.frequencyHistory);
    const { note, closestFreq } = this.findClosestNote(smoothedFrequency);
    const cents = Math.round(1200 * Math.log2(smoothedFrequency / closestFreq));
    const isInTune = Math.abs(cents) <= this.centTolerance;

    return { note, frequency: smoothedFrequency, cents, isInTune, confidence };
  }

  private findClosestNote(frequency: number): { note: string; closestFreq: number } {
    let closestNote = '';
    let closestFreq = 0;
    let minDistance = Infinity;

    for (const note of Object.keys(NOTE_FREQUENCIES)) {
      for (const freq of NOTE_FREQUENCIES[note]) {
        const distance = Math.abs(freq - frequency);
        if (distance < minDistance) {
          minDistance = distance;
          closestNote = note;
          closestFreq = freq;
        }
      }
    }

    return { note: closestNote, closestFreq };
  }

  public smoothFrequency(frequencies: number[], smoothingFactor = 0.7): number {
    if (frequencies.length === 0) return 0;
    if (frequencies.length === 1) return frequencies[0];

    let smoothed = frequencies[0];
    for (let i = 1; i < frequencies.length; i++) {
      smoothed = smoothingFactor * smoothed + (1 - smoothingFactor) * frequencies[i];
    }
    return smoothed;
  }

  public clearHistory(): void {
    this.frequencyHistory = [];
  }
}

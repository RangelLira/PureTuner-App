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

  constructor(centTolerance = 10) {
    this.centTolerance = centTolerance;
  }

  public detectPitch(frequency: number, confidence = 1.0): PitchDetectionResult {
    if (!frequency || frequency <= 0) {
      return { note: '', frequency: 0, cents: 0, isInTune: false, confidence: 0 };
    }

    const { note, closestFreq } = this.findClosestNote(frequency);
    const cents = Math.round(1200 * Math.log2(frequency / closestFreq));
    const isInTune = Math.abs(cents) <= this.centTolerance;

    return { note, frequency, cents, isInTune, confidence };
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

  public clearHistory(): void {}
}

export interface FrequencyData {
  frequency: number;
  amplitude: number;
  note: string;
  cents: number;
}

export interface TunerState {
  isListening: boolean;
  currentNote: string;
  frequency: number;
  cents: number;
  isInTune: boolean;
}

export interface GuitarTuning {
  id: string;
  name: string;
  frequencies: number[];
  notes: string[];
}

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export interface CardProps {
  children: React.ReactNode;
  style?: object;
}

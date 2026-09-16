import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = '@puretuner/leftHanded';

// Preferência de canhoto — compartilhada pelas telas Acordes e Escalas via
// App.tsx (ambas usam ShapeFretboard). Ao contrário do estado de
// tom/qualidade/escala, essa é persistida: não faz sentido o usuário ter que
// reconfigurar a cada abertura do app.
export function useLeftHanded() {
  const [leftHanded, setLeftHandedState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(value => {
      if (value != null) setLeftHandedState(value === '1');
    });
  }, []);

  const toggleLeftHanded = () => {
    setLeftHandedState(prev => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  return { leftHanded, toggleLeftHanded };
}

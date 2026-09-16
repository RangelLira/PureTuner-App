/**
 * Mocks para módulos nativos de terceiros que não existem no ambiente de
 * teste (Jest não roda numa app Android real) — sem eles, qualquer teste
 * que monte a árvore de componentes (ex.: __tests__/App.test.tsx) falha ao
 * tentar acessar o módulo nativo no import.
 */

jest.mock('react-native-sound', () => {
  class SoundMock {
    static setCategory = jest.fn();
    static MAIN_BUNDLE = 'MAIN_BUNDLE';

    isLoaded() {
      return true;
    }
    play(onEnd) {
      onEnd?.(true);
    }
    setCurrentTime() {}
    release() {}
  }
  return SoundMock;
});

jest.mock('react-native-audio-record', () => ({
  init: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('react-native-keep-awake', () => ({
  activate: jest.fn(),
  deactivate: jest.fn(),
}));

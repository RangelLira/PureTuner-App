import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { useLeftHanded } from '../../src/hooks/useLeftHanded';

type HookValue = ReturnType<typeof useLeftHanded>;

function Probe({ onRender }: { onRender: (v: HookValue) => void }) {
  const value = useLeftHanded();
  onRender(value);
  return null;
}

async function mount(onRender: (v: HookValue) => void) {
  await act(async () => {
    create(<Probe onRender={onRender} />);
  });
}

describe('useLeftHanded', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('começa destro (leftHanded=false) quando não há preferência salva', async () => {
    let latest: HookValue | undefined;
    await mount(v => { latest = v; });
    expect(latest?.leftHanded).toBe(false);
  });

  test('toggleLeftHanded alterna o estado e persiste no AsyncStorage', async () => {
    let latest: HookValue | undefined;
    await mount(v => { latest = v; });

    await act(async () => {
      latest?.toggleLeftHanded();
    });
    expect(latest?.leftHanded).toBe(true);
    expect(await AsyncStorage.getItem('@puretuner/leftHanded')).toBe('1');

    await act(async () => {
      latest?.toggleLeftHanded();
    });
    expect(latest?.leftHanded).toBe(false);
    expect(await AsyncStorage.getItem('@puretuner/leftHanded')).toBe('0');
  });

  test('uma nova montagem (ex.: reabrir o app) lê de volta a preferência persistida', async () => {
    await AsyncStorage.setItem('@puretuner/leftHanded', '1');

    let latest: HookValue | undefined;
    await mount(v => { latest = v; });

    expect(latest?.leftHanded).toBe(true);
  });
});

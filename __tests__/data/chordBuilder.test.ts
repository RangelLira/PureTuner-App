import {
  EMPTY_BUILDER,
  MAX_WINDOW_START,
  builderToFretboard,
  clearBuilder,
  fittingWindowStart,
  setBarre,
  setTonicString,
  setWindowStart,
  soundingFret,
  soundingPitches,
  tapFret,
  tapOpenString,
  transposeBuilder,
} from '../../src/data/chordBuilder';

describe('Montar acorde — regras do braço', () => {
  it('toque marca, segundo toque desmarca', () => {
    let s = tapFret(EMPTY_BUILDER, 'A', 3);
    expect(soundingFret(s, 'A')).toBe(3);
    s = tapFret(s, 'A', 3);
    expect(soundingFret(s, 'A')).toBeNull();
  });

  it('outra casa na mesma corda substitui (uma nota por corda)', () => {
    let s = tapFret(EMPTY_BUILDER, 'A', 5);
    s = tapFret(s, 'A', 3);
    expect(soundingFret(s, 'A')).toBe(3);
    expect(soundingPitches(s)).toEqual([48]);
  });

  it('corda solta alterna solta ↔ abafada; nota presa vira solta', () => {
    let s = tapOpenString(EMPTY_BUILDER, 'e');
    expect(soundingFret(s, 'e')).toBe(0);
    s = tapOpenString(s, 'e');
    expect(soundingFret(s, 'e')).toBeNull();
    s = tapOpenString(tapFret(s, 'B', 1), 'B');
    expect(soundingFret(s, 'B')).toBe(0);
  });

  it('não passa da casa 15', () => {
    expect(tapFret(EMPTY_BUILDER, 'E', 16)).toBe(EMPTY_BUILDER);
    expect(setWindowStart(EMPTY_BUILDER, 50).windowStart).toBe(MAX_WINDOW_START);
    expect(setWindowStart(EMPTY_BUILDER, -3).windowStart).toBe(1);
  });
});

describe('Montar acorde — pestana', () => {
  // F com pestana na 1ª casa (shape de Mi).
  const fMajor = () => {
    let s = setBarre(EMPTY_BUILDER, 1, ['E', 'A', 'D', 'G', 'B', 'e']);
    s = tapFret(s, 'G', 2);
    s = tapFret(s, 'A', 3);
    return tapFret(s, 'D', 3);
  };

  it('nota acima da pestana soa no lugar dela', () => {
    const s = fMajor();
    expect(['E', 'A', 'D', 'G', 'B', 'e'].map(x => soundingFret(s, x as any))).toEqual([1, 3, 3, 2, 1, 1]);
  });

  it('nota atrás da pestana é ignorada', () => {
    const s = setBarre(EMPTY_BUILDER, 5, ['A', 'D', 'G']);
    expect(tapFret(s, 'D', 3)).toBe(s);
  });

  it('tocar na casa da pestana remove a pestana', () => {
    const s = tapFret(fMajor(), 'e', 1);
    expect(s.barre).toBeNull();
    expect(soundingFret(s, 'e')).toBeNull();
    expect(soundingFret(s, 'A')).toBe(3); // notas próprias continuam
  });

  it('pestana precisa de 2+ cordas', () => {
    expect(setBarre(EMPTY_BUILDER, 3, ['A'])).toBe(EMPTY_BUILDER);
  });

  it('soltar uma corda da pestana de 2 cordas desfaz a pestana', () => {
    let s = setBarre(EMPTY_BUILDER, 2, ['B', 'e']);
    s = tapOpenString(s, 'e');
    expect(s.barre).toBeNull();
    expect(soundingFret(s, 'B')).toBe(2);
    expect(soundingFret(s, 'e')).toBe(0);
  });

  it('desenho: cordas da pestana aparecem na casa que soa, sem nota = abafada', () => {
    const d = builderToFretboard(setBarre(EMPTY_BUILDER, 3, ['A', 'D', 'G', 'B', 'e']));
    expect(d.muted).toEqual(['E']);
    expect(d.barres).toEqual([{ fret: 3, strings: ['A', 'D', 'G', 'B', 'e'] }]);
    expect(d.shape.A).toEqual([3]);
  });
});

describe('Montar acorde — tônica', () => {
  it('a primeira nota marcada é a tônica', () => {
    let s = tapFret(EMPTY_BUILDER, 'A', 3); // C
    s = tapFret(s, 'D', 2); // E
    expect(s.tonicPC).toBe(0);
  });

  it('desmarcar a tônica passa pra nota mais antiga que ainda soa', () => {
    let s = tapFret(EMPTY_BUILDER, 'A', 3); // C
    s = tapFret(s, 'G', 0 + 2); // A
    s = tapFret(s, 'D', 2); // E
    s = tapFret(s, 'A', 3); // desmarca C
    expect(s.tonicPC).toBe(9);
  });

  it('a tônica é a nota, não a corda: outro C mantém a tônica', () => {
    let s = tapFret(EMPTY_BUILDER, 'A', 3); // C
    s = tapFret(s, 'B', 1); // C de novo
    s = tapFret(s, 'A', 3); // desmarca o 1º C
    expect(s.tonicPC).toBe(0);
  });

  it('toque longo define a tônica', () => {
    let s = tapFret(EMPTY_BUILDER, 'D', 2); // E primeiro
    s = tapFret(s, 'A', 3); // C
    s = setTonicString(s, 'A');
    expect(s.tonicPC).toBe(0);
  });

  it('pestana primeiro: a tônica é a corda mais grave da pestana', () => {
    const s = setBarre(EMPTY_BUILDER, 5, ['A', 'D', 'G', 'B', 'e']);
    expect(s.tonicPC).toBe(2); // Ré na 5ª casa da corda Lá
  });

  it('limpar zera tudo mas mantém a janela', () => {
    const s = clearBuilder(setWindowStart(tapFret(EMPTY_BUILDER, 'A', 3), 5));
    expect(s.frets).toEqual({});
    expect(s.tonicPC).toBeNull();
    expect(s.windowStart).toBe(5);
  });
});

describe('Montar acorde — enquadramento do acorde concluído', () => {
  it('cabe a partir da casa 1 quando possível', () => {
    expect(fittingWindowStart(tapFret(EMPTY_BUILDER, 'A', 7))).toBe(1);
  });
  it('acorde alto começa na casa mais grave', () => {
    let s = tapFret(EMPTY_BUILDER, 'A', 5);
    s = tapFret(s, 'D', 9);
    expect(fittingWindowStart(s)).toBe(5);
    // Perto da casa 15 a janela para na 9 (mostra 9 a 15).
    expect(fittingWindowStart(tapFret(EMPTY_BUILDER, 'A', 12))).toBe(9);
  });
  it('acorde espalhado: a casa mais aguda fica visível', () => {
    let s = tapFret(EMPTY_BUILDER, 'E', 3);
    s = tapFret(s, 'e', 15);
    expect(fittingWindowStart(s)).toBe(9);
  });
});

describe('Montar acorde — transposição (troca de tom do personalizado)', () => {
  // C aberto: x 3 2 0 1 0
  const openC = () => {
    let s = tapFret(EMPTY_BUILDER, 'A', 3);
    s = tapFret(s, 'D', 2);
    s = tapOpenString(s, 'G');
    s = tapFret(s, 'B', 1);
    return tapOpenString(s, 'e');
  };
  const frets = (s: ReturnType<typeof openC>) =>
    (['E', 'A', 'D', 'G', 'B', 'e'] as const).map(x => soundingFret(s, x));

  it('C → D sobe 2 casas e as cordas soltas viram notas presas', () => {
    const d = transposeBuilder(openC(), 2)!;
    expect(frets(d)).toEqual([null, 5, 4, 2, 3, 2]);
    expect(d.tonicPC).toBe(2);
  });

  it('prefere a versão mais grave que cabe no braço', () => {
    let s = tapFret(EMPTY_BUILDER, 'A', 10);
    s = tapFret(s, 'D', 12);
    const t = transposeBuilder(s, 2)!; // 10 → 12 ou 0? desce: 0 e 2
    expect(frets(t)).toEqual([null, 0, 2, null, null, null]);
  });

  it('pestana acompanha', () => {
    const s = setBarre(EMPTY_BUILDER, 1, ['E', 'A', 'D', 'G', 'B', 'e']);
    expect(transposeBuilder(s, 2)!.barre).toEqual({ fret: 3, strings: ['E', 'A', 'D', 'G', 'B', 'e'] });
  });

  it('mesmo tom não muda nada', () => {
    const s = openC();
    expect(transposeBuilder(s, 12)).toBe(s);
  });

  it('não cabe no braço → null', () => {
    let s = tapOpenString(EMPTY_BUILDER, 'E');
    s = tapFret(s, 'e', 15);
    expect(transposeBuilder(s, 1)).toBeNull();
  });
});

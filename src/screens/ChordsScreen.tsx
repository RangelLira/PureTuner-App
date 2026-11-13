import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Note } from '@tonaljs/tonal';
import guitarData from '@tombatossals/chords-db/lib/guitar.json';
import { BuilderFretboard } from '../components/BuilderFretboard';
import { NoteChips } from '../components/NoteChips';
import { FretboardBarre, ShapeFretboard } from '../components/ShapeFretboard';
import { colors } from '../constants/colors';
import { ChordAnalysis, analyzeChord, degreesFor, suffixIntervals } from '../data/chordAnalysis';
import {
  ChordBuilderState,
  EMPTY_BUILDER,
  builderToFretboard,
  clearBuilder,
  fittingWindowStart,
  soundingPitches,
  transposeBuilder,
} from '../data/chordBuilder';
import { CHORD_SHAPES_C, FretboardData, transposeChordShape } from '../data/chordShapesC';
import {
  chordDescription,
  ChordSearchKey,
  chordSearchKeys,
  chordSuffixSymbol,
  matchChordSearch,
  normalizeChordQuery,
} from '../data/chordSuffixes';
import type { ShapeData } from '../data/scaleShapesC';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type ChordsNoteKey = typeof NOTES[number];
type NoteKey = ChordsNoteKey;

export interface ChordsState {
  tonic: ChordsNoteKey;
  suffixIdx: number;
  posIdx: number;
  // Grafia com que o acorde foi buscado (ex.: "C7+"), mostrada no círculo no
  // lugar do símbolo padrão ("Cmaj7") — quem copiou o nome de uma cifra
  // precisa ver o mesmo nome. Some ao trocar de tom ou de acorde.
  typedName?: string;
  // "Montar acorde". Ficam aqui (e não na tela) pra sobreviver à troca de aba.
  // draft: montagem em andamento (não nulo = modo Montar).
  draft?: ChordBuilderState | null;
  // custom: último acorde personalizado concluído — aparece como a posição
  // "Personalizado", antes dos shapes do banco do mesmo acorde. Some ao
  // buscar outro acorde ou concluir outra montagem; troca de tom o transpõe.
  custom?: ChordBuilderState | null;
  customActive?: boolean; // a posição exibida é a "Personalizado"
}

export const DEFAULT_CHORDS_STATE: ChordsState = { tonic: 'C', suffixIdx: 0, posIdx: 0 };

interface ChordsScreenProps {
  state: ChordsState;
  onStateChange: (patch: Partial<ChordsState>) => void;
  leftHanded: boolean;
  onToggleLeftHanded: () => void;
}

// Chave usada pelo dicionário @tombatossals/chords-db para cada tom.
const CHORD_DB_KEY: Record<NoteKey, string> = {
  'C': 'C', 'C#': 'Csharp', 'D': 'D', 'D#': 'Eb', 'E': 'E', 'F': 'F',
  'F#': 'Fsharp', 'G': 'G', 'G#': 'Ab', 'A': 'A', 'A#': 'Bb', 'B': 'B',
};

const STRINGS_LOW_TO_HIGH = ['E', 'A', 'D', 'G', 'B', 'e'] as const;
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

interface ChordPosition {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
  midi: number[];
}

interface ChordEntry {
  key: string;
  suffix: string;
  positions: ChordPosition[];
}

interface SearchResult {
  tonic: NoteKey;
  suffix: string;
  symbol: string;
  searchKeys: ChordSearchKey[];
}

interface SearchMatch extends SearchResult {
  label: string;
  exact: boolean;
}

// Lista achatada de todo tom × qualidade do dicionário, usada pela busca.
// Calculada uma única vez a partir do JSON estático.
const ALL_CHORDS: SearchResult[] = NOTES.flatMap(note => {
  const dbKey = CHORD_DB_KEY[note];
  const entries = ((guitarData as any).chords[dbKey] ?? []) as ChordEntry[];
  return entries.map(entry => ({
    tonic: note,
    suffix: entry.suffix,
    symbol: `${note}${chordSuffixSymbol(entry.suffix)}`,
    searchKeys: chordSearchKeys(note, entry.suffix),
  }));
});

// Estado da tela de Acordes já apontando para um acorde específico — usado
// pela Tela Campo Harmônico ao tocar num acorde do campo. `pc` é a classe de
// altura (0 = Dó), já que a grafia do campo (ex.: Mi♯, Sol♭) não existe na
// lista de tons desta tela.
export function chordsStateFor(pc: number, suffix: string): ChordsState {
  const tonic = NOTES[((pc % 12) + 12) % 12];
  const entries = ((guitarData as any).chords[CHORD_DB_KEY[tonic]] ?? []) as ChordEntry[];
  const idx = entries.findIndex(e => e.suffix === suffix);
  return { tonic, suffixIdx: idx >= 0 ? idx : 0, posIdx: 0 };
}

// Converte uma posição do dicionário (frets relativos ao baseFret, -1 = mudo)
// para o mesmo formato de ShapeData usado pelas escalas, mais a lista de
// cordas mudas e os grupos de pestana (mesmo traste em 2+ cordas). Usado como
// fallback para qualidades de acorde sem os 5 shapes CAGED cadastrados.
function positionToFretboardData(position: ChordPosition): FretboardData {
  const shape: ShapeData = {};
  const muted: string[] = [];
  const barreGroups = new Map<number, string[]>();

  position.frets.forEach((relFret, i) => {
    const stringKey = STRINGS_LOW_TO_HIGH[i];
    if (relFret === -1) {
      muted.push(stringKey);
      return;
    }
    if (relFret === 0) {
      shape[stringKey] = [0];
      return;
    }
    const abs = position.baseFret + relFret - 1;
    shape[stringKey] = [abs];
    if (position.barres.includes(relFret)) {
      const arr = barreGroups.get(relFret) ?? [];
      arr.push(stringKey);
      barreGroups.set(relFret, arr);
    }
  });

  const barres: FretboardBarre[] = Array.from(barreGroups.entries())
    .filter(([, strings]) => strings.length >= 2)
    .map(([relFret, strings]) => ({
      fret: position.baseFret + relFret - 1,
      strings,
    }));

  return { shape, muted, barres };
}

// A fonte reserva mais espaço acima da letra do que abaixo, então o texto
// centralizado pelo flexbox fica visualmente baixo no círculo — sobe ~6% do
// tamanho da fonte (medido no aparelho).
function circleTextStyle(text: string) {
  const fontSize = circleFontSize(text);
  return { fontSize, transform: [{ translateY: -fontSize * 0.06 }] };
}

// Nomes longos ("C#m7(b5)", "Cm(maj7)(b5)") encolhem só o necessário pra
// caber nos ~94dp úteis do círculo (~0,6 da fonte por caractere, em negrito).
function circleFontSize(text: string) {
  const cap = text.length <= 2 ? 32 : text.length <= 4 ? 26 : 20;
  const fit = Math.floor(94 / (text.length * 0.6));
  return Math.min(cap, Math.max(12, fit));
}

function shapeMinFret(shape: ShapeData) {
  const all = Object.values(shape).flat();
  return all.length > 0 ? Math.min(...all) : 0;
}

function entriesFor(tonic: NoteKey): ChordEntry[] {
  return ((guitarData as any).chords[CHORD_DB_KEY[tonic]] ?? []) as ChordEntry[];
}

// Entrada do dicionário equivalente a um acorde montado — dá as variações
// ("formatos convencionais") mostradas depois do "Personalizado". Inversão só
// tem equivalente quando o banco tem a tríade com esse baixo ("/E", "m/C");
// os shapes do acorde com a tônica no baixo seriam outro acorde. -1 = nenhuma.
function customEntryIdx(a: ChordAnalysis): number {
  if (!a.suffix || a.tonicPC === null) return -1;
  const entries = entriesFor(NOTES[a.tonicPC]);
  if (a.bassPC === a.tonicPC) return entries.findIndex(e => e.suffix === a.suffix);
  if (a.suffix !== 'major' && a.suffix !== 'minor') return -1;
  const prefix = a.suffix === 'minor' ? 'm/' : '/';
  return entries.findIndex(
    e => e.suffix.startsWith(prefix) && Note.chroma(e.suffix.slice(prefix.length)) === a.bassPC,
  );
}

const analyze = (b: ChordBuilderState) => analyzeChord(soundingPitches(b), b.tonicPC);

const BUILD_INSTRUCTIONS =
  'Toque nas casas para marcar notas e no círculo da corda para soltá-la ou abafá-la. '
  + 'Arraste na vertical para fazer pestana e para o lado para subir no braço. '
  + 'Segure uma nota para torná-la a tônica.';

export function ChordsScreen({ state, onStateChange, leftHanded, onToggleLeftHanded }: ChordsScreenProps) {
  const { tonic, suffixIdx, posIdx, typedName } = state;
  const draft = state.draft ?? null;
  const building = draft !== null;
  const custom = state.custom ?? null;
  const [tonicModalVisible, setTonicModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tonicPC = NOTES.indexOf(tonic);

  const chordEntries = useMemo<ChordEntry[]>(() => entriesFor(tonic), [tonic]);

  const selectedEntry = chordEntries[suffixIdx];
  const dbPositions = selectedEntry?.positions ?? [];

  // Para as qualidades com os 5 shapes CAGED verificados, usamos esses shapes
  // transpostos, ordenados do mais acessível (traste mais baixo — geralmente
  // o mais usado/convencional) para o menos acessível. As demais qualidades
  // caem no fallback com as posições do dicionário @tombatossals/chords-db.
  const cagedShapes = selectedEntry ? CHORD_SHAPES_C[selectedEntry.suffix] : undefined;
  const usesCaged = !!cagedShapes;
  const currentDbPosition = dbPositions[posIdx];

  const orderedCagedShapes = useMemo<FretboardData[]>(() => {
    if (!cagedShapes) return [];
    return cagedShapes
      .map(template => transposeChordShape(template, tonicPC))
      .sort((a, b) => shapeMinFret(a.shape) - shapeMinFret(b.shape));
  }, [cagedShapes, tonicPC]);

  const totalPositions = usesCaged ? orderedCagedShapes.length : dbPositions.length;

  const dictName = typedName ?? (selectedEntry ? `${tonic}${chordSuffixSymbol(selectedEntry.suffix)}` : tonic);

  // Notas que compõem o acorde: união das classes de altura de todas as
  // posições cadastradas para essa qualidade, ordenadas a partir da tônica,
  // com o grau de cada uma pela fórmula do sufixo.
  const dictNotes = useMemo(() => {
    if (!selectedEntry) return { notes: [] as string[], degrees: [] as string[] };
    const pcs = new Set<number>();
    selectedEntry.positions.forEach(pos => pos.midi.forEach(m => pcs.add(m % 12)));
    const order = Array.from({ length: 12 }, (_, i) => (tonicPC + i) % 12).filter(pc => pcs.has(pc));
    return {
      notes: order.map(pc => NOTE_NAMES[pc]),
      degrees: degreesFor(tonicPC, order, suffixIntervals(selectedEntry.suffix)),
    };
  }, [selectedEntry, tonicPC]);

  // Montagem em andamento e acorde personalizado concluído.
  const draftAnalysis = useMemo(() => (draft ? analyze(draft) : null), [draft]);
  const customAnalysis = useMemo(() => (custom ? analyze(custom) : null), [custom]);
  const draftEmpty = !draftAnalysis || draftAnalysis.notes.length === 0;
  const draftValid = !!draftAnalysis?.name;
  // Personalizado sem equivalente no banco: só a posição "Personalizado".
  const customHasVariations = !!customAnalysis && customEntryIdx(customAnalysis) >= 0;
  const showCustom = !!custom && (!!state.customActive || !customHasVariations);

  // O que a tela mostra: montagem > personalizado > dicionário.
  const shown = building ? draftAnalysis! : customAnalysis;
  const chordName = shown ? shown.name ?? '' : dictName;
  const notes = shown ? shown.notes : dictNotes.notes;
  const degrees = shown ? shown.degrees : dictNotes.degrees;
  let description: string;
  if (building && draftEmpty) {
    description = BUILD_INSTRUCTIONS;
  } else if (shown) {
    description = [shown.hint, shown.suffix ? chordDescription(shown.suffix) : ''].filter(Boolean).join(' ');
  } else {
    description = selectedEntry ? chordDescription(selectedEntry.suffix) : '';
  }

  const customDrawing = showCustom ? builderToFretboard(custom!) : null;

  const fretboardData = useMemo<FretboardData | null>(() => {
    if (usesCaged) {
      return orderedCagedShapes[posIdx] ?? null;
    }
    return currentDbPosition ? positionToFretboardData(currentDbPosition) : null;
  }, [usesCaged, orderedCagedShapes, posIdx, currentDbPosition]);

  const searchResults = useMemo(() => {
    const query = normalizeChordQuery(searchQuery);
    if (!query) return [];
    const matches: SearchMatch[] = [];
    for (const c of ALL_CHORDS) {
      for (const m of matchChordSearch(c.searchKeys, query)) matches.push({ ...c, ...m });
    }
    // Grafia exata primeiro, depois as mais curtas — as mais próximas do que
    // foi digitado (em "C7": C7, C7M, C7+… antes de C7(#9), C7sus4). O sort é
    // estável, então empates mantêm a ordem do dicionário.
    matches.sort((a, b) => Number(b.exact) - Number(a.exact) || a.label.length - b.label.length);
    return matches.slice(0, 150);
  }, [searchQuery]);

  const handleTonicSelect = (note: NoteKey) => {
    setTonicModalVisible(false);
    // Personalizado: troca de tom transpõe o acorde montado.
    if (custom && custom.tonicPC !== null) {
      const moved = transposeBuilder(custom, NOTES.indexOf(note) - custom.tonicPC);
      if (moved) {
        const idx = customEntryIdx(analyze(moved));
        onStateChange({ custom: moved, customActive: true, tonic: note, suffixIdx: Math.max(idx, 0), posIdx: 0 });
        return;
      }
    }
    // Mantém a mesma qualidade ao trocar só o tom (ex.: Dm -> B continua Bm),
    // em vez de sempre voltar para a qualidade maior.
    let newSuffixIdx = 0;
    if (selectedEntry) {
      const idx = entriesFor(note).findIndex(e => e.suffix === selectedEntry.suffix);
      if (idx >= 0) newSuffixIdx = idx;
    }
    onStateChange({
      tonic: note, suffixIdx: newSuffixIdx, posIdx: 0, typedName: undefined, custom: null, customActive: false,
    });
  };

  // Buscar no meio da montagem esquece o que estava sendo montado.
  const openSearchModal = () => {
    if (building) onStateChange({ draft: null });
    setSearchQuery('');
    setSearchModalVisible(true);
  };

  const handleSearchSelect = (result: SearchMatch) => {
    const idx = entriesFor(result.tonic).findIndex(e => e.suffix === result.suffix);
    onStateChange({
      tonic: result.tonic,
      suffixIdx: idx >= 0 ? idx : 0,
      posIdx: 0,
      typedName: result.label !== result.symbol ? result.label : undefined,
      custom: null,
      customActive: false,
    });
    setSearchModalVisible(false);
    setSearchQuery('');
  };

  // "Montar acorde" sempre começa uma montagem nova (mesmo no meio de outra).
  // O personalizado anterior só se perde ao concluir o novo.
  const startBuilding = () => onStateChange({ draft: EMPTY_BUILDER });
  const updateDraft = (next: ChordBuilderState) => onStateChange({ draft: next });
  const concludeDraft = () => {
    const idx = customEntryIdx(draftAnalysis!);
    onStateChange({
      custom: draft,
      customActive: true,
      draft: null,
      typedName: undefined,
      posIdx: 0,
      ...(idx >= 0 ? { tonic: NOTES[draft!.tonicPC!], suffixIdx: idx } : {}),
    });
  };

  // Com personalizado, a posição 0 é ele e as seguintes são os shapes do banco.
  const goPrevious = () => {
    if (custom && posIdx === 0) onStateChange({ customActive: true });
    else onStateChange({ posIdx: Math.max(0, posIdx - 1) });
  };
  const goNext = () => {
    if (showCustom) onStateChange({ customActive: false, posIdx: 0 });
    else onStateChange({ posIdx: Math.min(totalPositions - 1, posIdx + 1) });
  };
  const atFirst = custom ? showCustom : posIdx === 0;
  const atLast = !showCustom && posIdx >= totalPositions - 1;

  const handChip = (
    <TouchableOpacity style={styles.handChip} onPress={onToggleLeftHanded} activeOpacity={0.8}>
      <Text style={styles.handChipText}>{leftHanded ? 'Canhoto' : 'Destro'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acordes</Text>

      {/* Tonic circle button — mostra o acorde completo (ex.: "Em7(b5)") */}
      <TouchableOpacity
        style={styles.tonicButton}
        onPress={() => setTonicModalVisible(true)}
        activeOpacity={0.8}
        disabled={building}
      >
        <Text style={[styles.tonicButtonText, circleTextStyle(chordName)]}>
          {chordName}
        </Text>
      </TouchableOpacity>

      {/* Buscar (dicionário) | Montar acorde (no braço) */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.searchChip} onPress={openSearchModal} activeOpacity={0.8}>
          <Text style={styles.searchChipText}>Buscar acorde</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchChip} onPress={startBuilding} activeOpacity={0.8}>
          <Text style={styles.searchChipText}>Montar acorde</Text>
        </TouchableOpacity>
      </View>

      {/* Notas do acorde com o grau de cada uma acima */}
      <NoteChips notes={notes} degrees={degrees} />

      {/* Description */}
      <Text style={styles.description} numberOfLines={4} adjustsFontSizeToFit>{description}</Text>

      {/* Chord fretboard */}
      {building ? (
        <>
          <View style={styles.fretboardContainer}>
            <BuilderFretboard state={draft!} onChange={updateDraft} leftHanded={leftHanded} />
          </View>
          <View style={styles.indicatorRow}>{handChip}</View>
        </>
      ) : customDrawing ? (
        <>
          <View style={styles.fretboardContainer}>
            <ShapeFretboard
              shape={customDrawing.shape}
              tonicPC={custom!.tonicPC ?? -1}
              barres={customDrawing.barres}
              mutedStrings={customDrawing.muted}
              leftHanded={leftHanded}
              windowStart={fittingWindowStart(custom!)}
            />
          </View>
          <View style={styles.indicatorRow}>
            <Text style={styles.shapeIndicator}>Personalizado</Text>
            {handChip}
          </View>
        </>
      ) : fretboardData ? (
        <>
          <View style={styles.fretboardContainer}>
            <ShapeFretboard
              shape={fretboardData.shape}
              tonicPC={tonicPC}
              barres={fretboardData.barres}
              mutedStrings={fretboardData.muted}
              leftHanded={leftHanded}
            />
          </View>
          <View style={styles.indicatorRow}>
            <Text style={styles.shapeIndicator}>{posIdx + 1} / {totalPositions}</Text>
            {handChip}
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Acorde não disponível</Text>
        </View>
      )}

      {/* Push nav buttons to same vertical position as TunerScreen's Iniciar */}
      <View style={styles.spacer} />

      {/* Navigation buttons — no modo Montar: Voltar (braço vazio) ou Limpar,
          e Concluir (só com um acorde reconhecido). Personalizado sem
          variações no banco: sem botões. */}
      {building ? (
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonSecondary]}
            onPress={() => onStateChange({ draft: draftEmpty ? null : clearBuilder(draft!) })}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonText}>{draftEmpty ? 'Voltar' : 'Limpar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, !draftValid && styles.navButtonDisabled]}
            onPress={concludeDraft}
            activeOpacity={0.8}
            disabled={!draftValid}
          >
            <Text style={styles.navButtonText}>Concluir</Text>
          </TouchableOpacity>
        </View>
      ) : custom && !customHasVariations ? (
        <View style={styles.navRowPlaceholder} />
      ) : (
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navButton, atFirst && styles.navButtonDisabled]}
            onPress={goPrevious}
            activeOpacity={0.8}
            disabled={atFirst}
          >
            <Text style={styles.navButtonText}>Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, atLast && styles.navButtonDisabled]}
            onPress={goNext}
            activeOpacity={0.8}
            disabled={atLast}
          >
            <Text style={styles.navButtonText}>Próxima</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tonic selector modal */}
      <Modal
        visible={tonicModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTonicModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTonicModalVisible(false)}
        >
          <TouchableOpacity style={styles.tonicModalCard} activeOpacity={1}>
            <Text style={styles.modalTitle}>Escolha o Tom</Text>
            <View style={styles.notesGrid}>
              {NOTES.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.noteGridChip, tonic === n && styles.noteGridChipActive]}
                  onPress={() => handleTonicSelect(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.noteGridText, tonic === n && styles.noteGridTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setTonicModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Chord search modal */}
      <Modal
        visible={searchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSearchModalVisible(false)}
        >
          <TouchableOpacity style={styles.scaleModalCard} activeOpacity={1}>
            <Text style={styles.modalTitle}>Buscar Acorde</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              // tônica sempre maiúscula: o leigo não precisa do shift pro "C"
              // (o resto fica como digitado — o "M" distingue Cm7M de Cm7m)
              onChangeText={text => setSearchQuery(text.charAt(0).toUpperCase() + text.slice(1))}
              placeholder="Ex.: C, Em7(b5), F#m..."
              placeholderTextColor={colors.neutral.mediumGray}
              autoFocus
              autoCapitalize="sentences"
              autoCorrect={false}
            />
            <ScrollView style={styles.scaleList} showsVerticalScrollIndicator={false}>
              {searchQuery.trim().length === 0 ? (
                <Text style={styles.searchHint}>Digite o nome de um acorde para buscar.</Text>
              ) : searchResults.length === 0 ? (
                <Text style={styles.searchHint}>Acorde não encontrado.</Text>
              ) : (
                searchResults.map((result, i) => (
                  <TouchableOpacity
                    key={`${result.label}-${i}`}
                    style={styles.scaleListItem}
                    onPress={() => handleSearchSelect(result)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.scaleListText}>{result.label}</Text>
                    {result.label !== result.symbol && (
                      <Text style={styles.searchAliasText}>mesmo acorde que {result.symbol}</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSearchModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.lightGray,
    paddingTop: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    textAlign: 'center',
    marginBottom: 16,
  },
  tonicButton: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.neutral.white,
    borderWidth: 3,
    borderColor: colors.secondary.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tonicButtonText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    width: '100%',
  },
  searchChip: {
    flex: 1, // os dois botões da linha com a mesma largura
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.secondary.darkBlue,
    alignItems: 'center',
  },
  searchChipText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  description: {
    fontSize: 13,
    color: colors.secondary.mediumBlue,
    textAlign: 'center',
    lineHeight: 19,
    height: 76,
    // respiro acima vindo do de baixo: o braço continua na mesma posição
    marginTop: 8,
    marginBottom: 0,
  },
  fretboardContainer: {
    alignItems: 'center',
    marginBottom: 8,
    marginHorizontal: -24,
  },
  indicatorRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  shapeIndicator: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
    fontWeight: '500',
  },
  handChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.secondary.darkBlue,
  },
  handChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral.white,
  },
  spacer: {
    flex: 1,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.neutral.mediumGray,
  },
  navRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 40,
    width: '100%',
  },
  navButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 32,
    backgroundColor: colors.primary.orange,
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  navRowPlaceholder: {
    paddingBottom: 40,
  },
  navButtonSecondary: {
    backgroundColor: colors.secondary.darkBlue,
  },
  navButtonDisabled: {
    backgroundColor: colors.neutral.mediumGray,
    elevation: 0,
    shadowOpacity: 0,
  },
  navButtonText: {
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: '600',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tonicModalCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '86%',
    alignItems: 'center',
  },
  scaleModalCard: {
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    width: '86%',
    maxHeight: '68%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    marginBottom: 18,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    // Largura fixa pra exatamente 4 colunas (4×56 + 3×10 de gap) — sem
    // isso o flexWrap quebra a linha onde a largura da tela permitir,
    // dando grades inconsistentes tipo 5-5-2 em vez de 4-4-4.
    width: 254,
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  noteGridChip: {
    width: 56,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.neutral.lightGray,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteGridChipActive: {
    backgroundColor: colors.secondary.darkBlue,
    borderColor: colors.secondary.darkBlue,
  },
  noteGridText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary.darkBlue,
  },
  noteGridTextActive: {
    color: colors.neutral.white,
  },
  searchInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.secondary.darkBlue,
    marginBottom: 14,
  },
  searchHint: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    paddingVertical: 20,
  },
  scaleList: {
    width: '100%',
  },
  scaleListItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 2,
  },
  scaleListItemActive: {
    backgroundColor: colors.secondary.darkBlue,
  },
  scaleListText: {
    fontSize: 16,
    color: colors.secondary.darkBlue,
    fontWeight: '500',
  },
  searchAliasText: {
    fontSize: 13,
    color: colors.neutral.mediumGray,
    marginTop: 2,
  },
  scaleListTextActive: {
    color: colors.neutral.white,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  cancelText: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
    fontWeight: '600',
  },
});

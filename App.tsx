import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from './src/constants/colors';
import { AboutModal } from './src/screens/AboutScreen';
import { ChordsScreen } from './src/screens/ChordsScreen';
import { MetronomeScreen } from './src/screens/MetronomeScreen';
import { ScalesScreen } from './src/screens/ScalesScreen';
import { TunerScreen } from './src/screens/TunerScreen';

type TabName = 'tuner' | 'metronome' | 'chords' | 'scales';

interface Tab {
  name: TabName;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { name: 'tuner', label: 'Afinador', icon: '🎸' },
  { name: 'metronome', label: 'Metrônomo', icon: '🥁' },
  { name: 'chords', label: 'Acordes', icon: '🎵' },
  { name: 'scales', label: 'Escalas', icon: '🎼' },
];

function renderScreen(tab: TabName) {
  switch (tab) {
    case 'tuner':
      return <TunerScreen />;
    case 'metronome':
      return <MetronomeScreen />;
    case 'chords':
      return <ChordsScreen />;
    case 'scales':
      return <ScalesScreen />;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('tuner');
  const [showAbout, setShowAbout] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Conteúdo da tela ativa */}
        <View style={styles.screenContainer}>
          {renderScreen(activeTab)}
        </View>

        {/* Botão "Sobre" — flutuante no topo-direito, visível em todas as telas */}
        <TouchableOpacity
          style={styles.aboutButton}
          onPress={() => setShowAbout(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.aboutButtonText}>?</Text>
        </TouchableOpacity>

        {/* Barra de navegação inferior */}
        <View style={styles.tabBar}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.name;
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.name)}
                activeOpacity={0.7}
              >
                {isActive && <View style={styles.activeIndicator} />}
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.white,
  },
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  aboutButton: {
    position: 'absolute',
    top: 64,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  aboutButtonText: {
    color: colors.neutral.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    includeFontPadding: false,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 46,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary.orange,
  },
  tabIcon: {
    fontSize: 26,
    marginBottom: 5,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primary.orange,
  },
  tabLabelInactive: {
    color: colors.neutral.mediumGray,
  },
});

import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from './src/constants/colors';
import { ChordsScreen, MetronomeScreen, ScalesScreen } from './src/screens/ComingSoonScreens';
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen(activeTab)}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.name)}
              activeOpacity={0.7}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primary.orange : colors.neutral.mediumGray },
                ]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.lightGray,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary.orange,
  },
});

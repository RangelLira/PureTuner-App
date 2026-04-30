import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutModal({ visible, onClose }: AboutModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            bounces={false}
          >
            <Text style={styles.appName}>Pure Tuner</Text>
            <Text style={styles.tagline}>O canivete suíço do músico brasileiro</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Sobre o app</Text>
            <Text style={styles.body}>
              Pure Tuner reúne as ferramentas essenciais para o músico em estudo: afinador
              cromático de alta precisão, metrônomo com divisões rítmicas, dicionário completo
              de acordes e tablatura das principais escalas.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Afinador</Text>
            <Text style={styles.body}>
              Afinação padrão A 440 Hz. Usa o microfone do dispositivo para detectar a nota
              tocada e exibe em tempo real a posição de afinação com precisão em cents.
              A tela permanece acesa enquanto o afinador estiver ativo.
            </Text>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Versão</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Afinação padrão</Text>
              <Text style={styles.infoValue}>A 440 Hz</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Idioma</Text>
              <Text style={styles.infoValue}>Português (BR)</Text>
            </View>

            <Text style={styles.copyright}>Feito para músicos brasileiros</Text>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.neutral.white,
    borderRadius: 24,
    width: '100%',
    maxHeight: '82%',
    overflow: 'hidden',
  },
  scroll: {
    padding: 28,
    paddingBottom: 12,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary.orange,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.lightGray,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.secondary.darkBlue,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.neutral.mediumGray,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary.darkBlue,
  },
  copyright: {
    fontSize: 12,
    color: colors.neutral.mediumGray,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 4,
  },
  closeButton: {
    backgroundColor: colors.primary.orange,
    paddingVertical: 17,
    alignItems: 'center',
  },
  closeText: {
    color: colors.neutral.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

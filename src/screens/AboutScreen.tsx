import React from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../constants/colors';

const CONTACT_EMAIL = 'contato.contestsoftware@gmail.com';
const CONTACT_ISSUES = 'https://github.com/RangelLira/PureTuner-App/issues';
const CONTACT_PRIVACY = 'https://rangellira.github.io/PureTuner-App/privacy.html';

// Ícones monocromáticos — mesmo padrão usado nos outros apps da Contest Software.
const CONTACT_ICON_PATHS = {
  github:
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  email:
    'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  shield:
    'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
};

function ContactIcon({ name, color }: { name: keyof typeof CONTACT_ICON_PATHS; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d={CONTACT_ICON_PATHS[name]} fill={color} />
    </Svg>
  );
}

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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Desenvolvido por</Text>
              <Text style={styles.infoValue}>Contest Software</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Contato</Text>
            <View style={styles.contactRow}>
              <TouchableOpacity
                style={styles.contactBtn}
                accessibilityRole="button"
                accessibilityLabel="Reportar problema no GitHub"
                onPress={() => Linking.openURL(CONTACT_ISSUES)}
              >
                <ContactIcon name="github" color={colors.secondary.darkBlue} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactBtn}
                accessibilityRole="button"
                accessibilityLabel="Enviar e-mail"
                onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
              >
                <ContactIcon name="email" color={colors.secondary.darkBlue} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactBtn}
                accessibilityRole="button"
                accessibilityLabel="Política de Privacidade"
                onPress={() => Linking.openURL(CONTACT_PRIVACY)}
              >
                <ContactIcon name="shield" color={colors.secondary.darkBlue} />
              </TouchableOpacity>
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
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  contactBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.neutral.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
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

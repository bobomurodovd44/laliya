import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useTranslation } from '../lib/localization';
import { DuoButton } from './DuoButton';

interface TryAgainModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TryAgainModal({ visible, onClose }: TryAgainModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {visible && (
          <Animated.View 
            entering={ZoomIn.duration(300)}
            style={styles.modalCard}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={80} color="#FFC107" />
            </View>
            <Text style={styles.title}>{t("exercise.tryAgain")}</Text>
            <Text style={styles.subtitle}>{t("exercise.notQuiteRight")}</Text>
            
            <View style={styles.buttonContainer}>
              <DuoButton 
                title={t("common.retry")} 
                onPress={onClose} 
                color="yellow" 
                size="medium" 
              />
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Slightly lighter overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: '#FFC107',
  },
  iconContainer: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#FFFDE7',
    borderRadius: 50,
  },
  title: {
    fontFamily: 'FredokaOne',
    fontSize: 28,
    color: '#F9A825', // Darker yellow/orange
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'BalsamiqSans',
    fontSize: 20,
    color: '#666',
    marginTop: 12,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 10,
  }
});

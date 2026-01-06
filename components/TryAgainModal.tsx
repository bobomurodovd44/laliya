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
            <Ionicons name="close-circle" size={80} color="#FF4B4B" />
            <Text style={styles.title}>{t("exercise.tryAgain")}</Text>
            <Text style={styles.subtitle}>{t("exercise.notQuiteRight")}</Text>
            
            <View style={styles.buttonContainer}>
              <DuoButton 
                title={t("common.retry")} 
                onPress={onClose} 
                color="red" 
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
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent black
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontFamily: 'FredokaOne',
    fontSize: 32,
    color: '#FF4B4B',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'BalsamiqSans',
    fontSize: 20,
    color: '#666',
    marginTop: 8,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  }
});

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Colors } from '../constants';
import { useTranslation } from '../lib/localization';
import { DuoButton } from './DuoButton';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteAccountModal({ 
  visible, 
  onClose, 
  onConfirm,
  isDeleting 
}: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const [confirmationText, setConfirmationText] = useState('');
  
  const isConfirmed = confirmationText.toLowerCase() === 'tasdiqlash';

  const handleClose = () => {
    setConfirmationText('');
    onClose();
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {visible && (
            <Animated.View 
              entering={ZoomIn.duration(300)}
              style={styles.modalCard}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="warning" size={60} color={Colors.error} />
              </View>
              
              <Text style={styles.title}>{t("profile.deleteAccountTitle")}</Text>
              <Text style={styles.subtitle}>{t("profile.deleteAccountSubtitle")}</Text>
              
              <View style={styles.inputSection}>
                <Text style={styles.label}>
                  {t("profile.deleteAccountConfirmLabel").split("'tasdiqlash'").map((part, index, array) => (
                    <React.Fragment key={index}>
                      {part}
                      {index < array.length - 1 && (
                        <Text style={styles.keyword}>'tasdiqlash'</Text>
                      )}
                    </React.Fragment>
                  ))}
                </Text>
                <TextInput
                  style={styles.input}
                  value={confirmationText}
                  onChangeText={setConfirmationText}
                  placeholder={t("profile.deleteAccountPlaceholder")}
                  placeholderTextColor={Colors.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              <View style={styles.buttonContainer}>
                <DuoButton 
                  title={t("common.cancel")} 
                  onPress={handleClose} 
                  color="gray" 
                  size="medium"
                  disabled={isDeleting}
                />
                <View style={{ height: 12 }} />
                <DuoButton 
                  title={isDeleting ? t("common.loading") : t("common.delete")} 
                  onPress={onConfirm} 
                  color="red" 
                  size="medium"
                  disabled={!isConfirmed || isDeleting}
                />
              </View>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: 340,
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.errorLight,
    borderRadius: 100,
  },
  title: {
    fontFamily: 'FredokaOne',
    fontSize: 24,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputSection: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontFamily: 'BalsamiqSans',
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  keyword: {
    color: Colors.secondary,
  },
  input: {
    width: '100%',
    height: 54,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontFamily: 'BalsamiqSans',
    fontSize: 18,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  buttonContainer: {
    width: '100%',
  }
});

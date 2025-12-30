import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Body } from '../components/Typography';
import { Colors, Spacing, Typography } from '../constants';

export default function RecordAudio() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isRecording, setIsRecording] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Animated.timing(
      new Animated.Value(0),
      {
        toValue: 0.6,
        duration: 1000,
        useNativeDriver: false,
      }
    ).start(({ finished }) => {
      if (finished) setProgress(0.6);
    });
  }, []);

  useEffect(() => {
    let pulseInterval: any;
    if (isRecording) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
      };
      pulse();
      pulseInterval = setInterval(pulse, 1000);
    } else {
      pulseAnim.setValue(1);
    }
    return () => clearInterval(pulseInterval);
  }, [isRecording, pulseAnim]);

  const handleToggleRecord = () => {
    setIsRecording(!isRecording);
  };

  const handleSpeak = () => {
    // Text-to-speech logic
  };

  return (
    <PageContainer useFloatingShapes>
      <PageHeader 
        showBackButton
        showProgress
        progress={progress}
      />

      <View style={styles.contentContainer}>
        <View style={styles.imageCard}>
          <Image 
            source={require('../assets/family.jpg')}
            style={styles.targetImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.textContainer}>
          <Body style={styles.targetText} weight="bold">Family</Body>
          <TouchableOpacity style={styles.speakButton} onPress={handleSpeak}>
            <Ionicons name="volume-high" size={32} color={Colors.textWhite} />
          </TouchableOpacity>
        </View>

        <View style={styles.recordingArea}>
          <TouchableOpacity 
            onPress={handleToggleRecord}
            activeOpacity={0.8}
            style={styles.recordButtonWrapper}
          >
            <Animated.View 
              style={[
                styles.pulseRing, 
                { 
                  transform: [{ scale: pulseAnim }],
                  opacity: isRecording ? 0.3 : 0,
                  backgroundColor: isRecording ? '#FF3B30' : Colors.transparent,
                }
              ]} 
            />
            
            <View style={[
              styles.recordButton, 
              { backgroundColor: isRecording ? '#FF3B30' : Colors.secondary }
            ]}>
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={64} 
                color={Colors.textWhite} 
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.xxxl,
    paddingTop: Spacing.padding.md,
    gap: Spacing.gap.xl,
  },
  imageCard: {
    width: 330,
    height: 330,
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.padding.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: Spacing.borderWidth.xxxthick,
    borderBottomWidth: Spacing.borderWidth.xxxthick,
    borderLeftWidth: Spacing.borderWidth.xxxthick,
    borderRightWidth: Spacing.borderWidth.xxxthick,
    borderColor: Colors.borderDark,
  },
  targetImage: {
    width: '100%',
    height: '100%',
    borderRadius: Spacing.radius.md,
  },
  textContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundLight,
    paddingVertical: Spacing.padding.md,
    paddingHorizontal: Spacing.padding.xxl,
    borderRadius: Spacing.radius.xl,
    ...Spacing.shadow.medium,
  },
  targetText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.xxxl,
    color: Colors.textPrimary,
  },
  speakButton: {
    backgroundColor: Colors.badgeLevel,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 80,
  },
  recordButtonWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.margin.lg,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...Spacing.shadow.large,
    borderWidth: Spacing.borderWidth.xxxthick,
    borderColor: Colors.backgroundLight,
  },
});

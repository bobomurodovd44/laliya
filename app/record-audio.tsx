import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecordAudio() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isRecording, setIsRecording] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Background shapes animations (consistent with other pages)
  const shape1Anim = useRef(new Animated.Value(0)).current;
  const shape2Anim = useRef(new Animated.Value(0)).current;
  const shape3Anim = useRef(new Animated.Value(0)).current;
  const shape4Anim = useRef(new Animated.Value(0)).current;
  const shape5Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar on mount
    Animated.timing(progressAnim, {
      toValue: 0.6, // Mock progress 60%
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Floating shapes
    const animateShape = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: duration, useNativeDriver: true }),
        ])
      ).start();
    };
    animateShape(shape1Anim, 4000);
    animateShape(shape2Anim, 5000);
    animateShape(shape3Anim, 6000);
    animateShape(shape4Anim, 4500);
    animateShape(shape5Anim, 5500);
  }, []);

  useEffect(() => {
    let pulseInterval: any;
    if (isRecording) {
      // Pulse animation loop
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
  }, [isRecording]);

  const handleToggleRecord = () => {
    setIsRecording(!isRecording);
  };

  const handleSpeak = () => {
    // Mock text-to-speech
    // console.log("Speaking: Apple");
  };

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <View style={styles.backgroundLayer} />

      {/* Animated Floating Shapes */}
      <View style={styles.animatedShapesContainer}>
        <Animated.View style={[styles.floatingShape, styles.circle1, {
          transform: [
            { translateY: shape1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
            { translateX: shape1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.square1, {
          transform: [
            { translateY: shape2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
            { rotate: shape2Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.circle2, {
          transform: [
            { translateY: shape3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) },
            { scale: shape3Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.square2, {
          transform: [
            { translateY: shape4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 35] }) },
            { translateX: shape4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.circle3, {
          transform: [
            { translateY: shape5Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -45] }) },
            { rotate: shape5Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-180deg'] }) }
          ]
        }]} />
      </View>

      {/* Header Area */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="#4B4B4B" />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })} 
              ]} 
            />
          </View>
        </View>
        
        {/* Spacer for alignment */}
        <View style={{ width: 45 }} /> 
      </View>

      <View style={styles.contentContainer}>
        {/* Image Card */}
        <View style={styles.imageCard}>
          <Image 
            source={require('../assets/family.jpg')}
            style={styles.targetImage}
            resizeMode="cover"
          />
        </View>

        {/* Text and Speak Button */}
        <View style={styles.textContainer}>
          <Text style={styles.targetText}>Family</Text>
          <TouchableOpacity style={styles.speakButton} onPress={handleSpeak}>
            <Ionicons name="volume-high" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Recording Area */}
        <View style={styles.recordingArea}>
           {/* Removed Listening Text */}
           
           <TouchableOpacity 
             onPress={handleToggleRecord}
             activeOpacity={0.8}
             style={styles.recordButtonWrapper}
           >
             {/* Animated Pulse Ring */}
             <Animated.View 
               style={[
                 styles.pulseRing, 
                 { 
                   transform: [{ scale: pulseAnim }],
                   opacity: isRecording ? 0.3 : 0,
                   backgroundColor: isRecording ? '#FF3B30' : 'transparent'
                 }
               ]} 
             />
             
             {/* Main Button */}
             <View style={[
               styles.recordButton, 
               { backgroundColor: isRecording ? '#FF3B30' : '#FF8C00' }
             ]}>
               <Ionicons 
                 name={isRecording ? "stop" : "mic"} 
                 size={64} 
                 color="#FFFFFF" 
               />
             </View>
           </TouchableOpacity>
           
           {/* Removed Instruction Text */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E8',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF5E8',
  },
  animatedShapesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  floatingShape: {
    position: 'absolute',
  },
  circle1: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD7E5',
    opacity: 0.3,
    top: 100,
    left: '10%',
  },
  square1: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#D4E4FF',
    opacity: 0.25,
    top: 250,
    right: '15%',
  },
  circle2: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE4B8',
    opacity: 0.2,
    top: 500,
    left: '60%',
  },
  square2: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#B8E6B8',
    opacity: 0.25,
    top: 600,
    left: '8%',
  },
  circle3: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8D4FF',
    opacity: 0.2,
    top: 500,
    right: '12%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 15,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#EEE',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#58CC02', // Duolingo green
    borderRadius: 6,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 10,
    gap: 20,
  },
  imageCard: {
    width: 330,
    height: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // Little bit of radius
    padding: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderColor: '#E5E5E5',
  },
  targetImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  textContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  targetText: {
    fontFamily: 'FredokaOne',
    fontSize: 28,
    color: '#333',
  },
  speakButton: {
    backgroundColor: '#4DA6FF',
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
    marginBottom: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 6,
    borderColor: '#FFF',
  },

});

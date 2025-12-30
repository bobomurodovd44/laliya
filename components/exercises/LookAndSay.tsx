import { Audio, AVPlaybackStatus } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { Exercise, items } from '../../data/data';
import { DuoButton } from '../DuoButton';

interface LookAndSayProps {
  exercise: Exercise;
  onComplete: () => void;
}

// Ring Component for Ripple Effect
const Ring = ({ index, isRecording }: { index: number, isRecording: boolean }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(
        withSequence(
            withDelay(
                index * 400, // Stagger based on index
                withTiming(1.6, { duration: 2000, easing: Easing.out(Easing.ease) }) // Slightly larger and slower
            ),
            withTiming(1, { duration: 0 }) // Reset
        ),
        -1, 
        false
      );
      
      opacity.value = withRepeat(
        withSequence(
            withDelay(
                index * 400,
                withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) })
            ),
            withTiming(1, { duration: 0 }) // Reset
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0);
    }
  }, [isRecording, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.blob,
        { backgroundColor: 'rgba(255, 140, 0, 0.5)', zIndex: -index }, 
        animatedStyle
      ]}
    />
  );
};

export default function LookAndSay({ exercise, onComplete }: LookAndSayProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Get item for this exercise
  const item = items.find(i => i.id === exercise.answerId);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Request permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Microphone permission is required to record audio');
        }
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    
    if (!recording) return;
    
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    setRecordedUri(uri);
    setRecording(null);
    onComplete(); 
  };

  const playItemAudio = async () => {
    if (!item?.audioUrl) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: item.audioUrl }
      );
      setSound(sound);
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.log('Error playing audio', error);
      setIsPlaying(false);
    }
  };

  const playRecordedAudio = async () => {
    if (!recordedUri) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordedUri }
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing recording', error);
    }
  };

  if (!item) return <View><Text>Item not found</Text></View>;

  return (
    <View style={styles.container}>
      {/* Centered Content */}
      <View style={styles.content}>
        
        {/* Image Card */}
        <View style={styles.imageCard}>
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Word and Audio Play Button */}
        <View style={styles.wordContainer}>
          <Text style={styles.word}>{item.word}</Text>
          <DuoButton
            title=""
            onPress={playItemAudio}
            color="blue"
            size="medium"
            customSize={60} // Explicit size
            style={styles.audioButton}
            icon="volume-high"
            shape="circle"
            iconSize={28}
          />
        </View>

      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        
        {/* Record Button Container */}
         <View style={styles.recordButtonContainer}>
            {/* Multiple Ripples */}
            {isRecording && (
                <>
                    <Ring index={0} isRecording={isRecording} />
                    <Ring index={1} isRecording={isRecording} />
                    <Ring index={2} isRecording={isRecording} />
                </>
            )}
            
            <DuoButton
              title=""
              onPress={isRecording ? stopRecording : startRecording}
              color={isRecording ? "red" : "orange"}
              size="large"
              customSize={100} // Explicit size
              style={styles.recordButton}
              icon={isRecording ? "stop" : "mic"}
              shape="circle"
              iconSize={48} 
            />
         </View>

         {/* Playback Button */}
         {recordedUri && !isRecording && (
           <View style={styles.playbackContainer}>
             <DuoButton
               title=""
               onPress={playRecordedAudio}
               color="green"
               size="medium"
               customSize={70} // Explicit size
               style={styles.playbackButton}
               icon="play"
               shape="circle"
               iconSize={32}
             />
           </View>
         )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  imageCard: {
    width: 280,
    height: 280,
    backgroundColor: 'white',
    borderRadius: 40,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  word: {
    fontFamily: 'FredokaOne',
    fontSize: 56,
    color: '#4A4A4A',
  },
  audioButton: {
    // Width/Height handled by customSize prop now
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 40,
    justifyContent: 'center',
    height: 120,
  },
  recordButtonContainer: {
    width: 100, 
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    position: 'relative', 
  },
  recordButton: {
    zIndex: 10, 
  },
  blob: {
    position: 'absolute',
    width: 100, 
    height: 100,
    borderRadius: 50,
    zIndex: -1,
  },
  playbackContainer: {
    position: 'absolute',
    right: 30,
    zIndex: 3,
  },
  playbackButton: {
    // Width/Height handled by customSize prop now
  }
});

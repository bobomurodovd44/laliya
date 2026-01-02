import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { Exercise, Item } from '../../data/data';
import { items } from '../../lib/items-store';
import { Body, Title } from '../Typography';
import { DuoButton } from '../DuoButton';
import TryAgainModal from '../TryAgainModal';
import ImageWithLoader from '../common/ImageWithLoader';

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

interface ListenAndPickProps {
  exercise: Exercise;
  onComplete: () => void;
}

export default function ListenAndPick({ exercise, onComplete }: ListenAndPickProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<Item[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Guard to prevent multiple onComplete calls
  const isCompletedRef = useRef(false);
  
  // Animation value for shake effect
  const shake = useSharedValue(0);

  // Get answer item
  const answerItem = items.find(i => i.id === exercise.answerId);

  // Create stable exercise identifier
  const exerciseId = `${exercise.stageId}-${exercise.order}`;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Shuffle items when exercise changes
  useEffect(() => {
    // Get items inside effect to avoid dependency issues
    const currentExerciseItems = exercise.optionIds
      .map(id => items.find(item => item.id === id))
      .filter((item): item is Item => item !== undefined);
    
    // Reset state
    setSelectedId(null);
    setIsCorrect(null);
    setShowTryAgain(false);
    isCompletedRef.current = false;
    
    // Shuffle items - ensure different order each time
    let shuffled = shuffleArray(currentExerciseItems);
    // Make sure it's actually shuffled (not same order)
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts && 
           shuffled.every((item, index) => item.id === currentExerciseItems[index]?.id)) {
      shuffled = shuffleArray(currentExerciseItems);
      attempts++;
    }
    
    setShuffledItems(shuffled);
  }, [exerciseId, exercise.optionIds]);

  const playAnswerAudio = async () => {
    if (!answerItem?.audioUrl) return;
    
    try {
      // Unload active sound if any
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: answerItem.audioUrl }
      );
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
      
      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      setIsPlaying(false);
    }
  };

  const handleSelect = useCallback((itemId: number) => {
    // If already completed, do nothing
    if (isCorrect === true || isCompletedRef.current) return;

    setSelectedId(itemId);
    
    if (itemId === exercise.answerId) {
      // Mark as completed immediately to prevent multiple calls
      isCompletedRef.current = true;
      setIsCorrect(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Call onComplete directly
      onComplete();
    } else {
      setIsCorrect(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowTryAgain(true); // Show modal
      
      // Trigger shake animation
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [isCorrect, exercise.answerId, onComplete]);

  const shakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shake.value }],
    };
  });

  if (!answerItem) return <View><Body>Answer item not found</Body></View>;

  return (
    <View style={styles.container}>
      <Title size="large" style={styles.title}>Listen and Pick</Title>
      <Body size="large" style={styles.question}>{exercise.question}</Body>

      <TryAgainModal 
        visible={showTryAgain} 
        onClose={() => setShowTryAgain(false)} 
      />

      {/* Answer Item Card with Audio */}
      <View style={styles.answerCard}>
        <Title size="huge" style={styles.answerWord}>{answerItem.word}</Title>
        <DuoButton
          title=""
          onPress={playAnswerAudio}
          color="blue"
          size="medium"
          customSize={60}
          style={styles.audioButton}
          icon="volume-high"
          shape="circle"
          iconSize={28}
        />
      </View>

      {/* Option Cards Grid */}
      <View style={styles.content}>
        <View style={styles.grid}>
          {shuffledItems.map((item) => {
            const isSelected = selectedId === item.id;
            // Only shake the selected wrong item
            const animatedStyle = (isSelected && isCorrect === false) ? shakeStyle : {};
            
            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.imageCard,
                  isSelected && styles.imageCardSelected,
                  isSelected && isCorrect === true && styles.imageCardCorrect,
                  isSelected && isCorrect === false && styles.imageCardWrong,
                  animatedStyle
                ]}
              >
                <TouchableOpacity
                  style={styles.touchable}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.7}
                  disabled={isCorrect === true}
                >
                  {item.imageUrl && (
                    <ImageWithLoader
                      source={{ uri: item.imageUrl }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: -20,
  },
  question: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
  },
  answerCard: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  answerWord: {
    fontFamily: 'FredokaOne',
    fontSize: 42,
    color: '#4A4A4A',
    flex: 1,
  },
  audioButton: {
    // Width/Height handled by customSize prop
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    width: '100%',
    maxWidth: 380,
  },
  imageCard: {
    width: '45%', // Responsive width
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  touchable: {
    flex: 1,
  },
  imageCardSelected: {
    borderColor: '#4A90E2',
    borderWidth: 6,
    transform: [{ scale: 1.08 }],
  },
  imageCardCorrect: {
    borderColor: '#58CC02', // Match DuoButton green
    borderWidth: 6,
    backgroundColor: '#E6FFFA',
    shadowColor: '#58CC02',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  imageCardWrong: {
    borderColor: '#FF4B4B', // Match DuoButton red scheme
    borderWidth: 6,
    backgroundColor: '#FFF0F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});


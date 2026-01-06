import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { Exercise, Item } from '../../data/data';
import { items } from '../../lib/items-store';
import { useTranslation } from '../../lib/localization';
import { Body, Title } from '../Typography';
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

interface OddOneOutProps {
  exercise: Exercise;
  onComplete: (isCorrect?: boolean) => void;
}

export default function OddOneOut({ exercise, onComplete }: OddOneOutProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shuffledItems, setShuffledItems] = useState<Item[]>([]);
  
  // Guard to prevent multiple onComplete calls
  const isCompletedRef = useRef(false);
  
  // Animation value for shake effect
  const shake = useSharedValue(0);

  // Create stable exercise identifier
  const exerciseId = `${exercise.stageId}-${exercise.order}`;

  // Shuffle items when exercise changes
  useEffect(() => {
    // Get items inside effect to avoid dependency issues
    const currentExerciseItems = exercise.optionIds
      .map(id => items.find(item => item.id === id))
      .filter((item): item is Item => item !== undefined);
    
    // Reset state
    setSelectedId(null);
    setIsCorrect(null);
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

  const handleSelect = useCallback((itemId: number) => {
    // If already completed, do nothing
    if (isCorrect === true || isCompletedRef.current) return;

    setSelectedId(itemId);
    
    if (itemId === exercise.answerId) {
      // Mark as completed immediately to prevent multiple calls
      isCompletedRef.current = true;
      setIsCorrect(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Call onComplete with isCorrect = true (default)
      onComplete(true);
    } else {
      setIsCorrect(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Call onComplete with isCorrect = false (will show KeepGoing celebration)
      onComplete(false);
      
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

  return (
    <View style={styles.container}>
      <Title size="large" style={styles.title}>{t('exercise.oddOneOut')}</Title>
      <Body size="large" style={styles.question}>{exercise.question}</Body>
      
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
    paddingTop: 20,
  },
  title: {
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 0,
  },
  question: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: '80%',
    fontSize: 20,
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
    maxWidth: 380, // Reduced from 500 per user feedback
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

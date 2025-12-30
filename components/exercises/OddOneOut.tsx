import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { Exercise, Item, items } from '../../data/data';
import { Body, Title } from '../Typography';
import TryAgainModal from '../TryAgainModal';

interface OddOneOutProps {
  exercise: Exercise;
  onComplete: () => void;
}

export default function OddOneOut({ exercise, onComplete }: OddOneOutProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showTryAgain, setShowTryAgain] = useState(false);
  
  // Animation value for shake effect
  const shake = useSharedValue(0);

  const handleSelect = (itemId: number) => {
    // If already completed, do nothing
    if (isCorrect === true) return;

    setSelectedId(itemId);
    
    if (itemId === exercise.answerId) {
      setIsCorrect(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
  };

  const shakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shake.value }],
    };
  });

  // Get items for this exercise
  // Safe filtering for items that match the IDs
  const exerciseItems = exercise.optionIds
    .map(id => items.find(item => item.id === id))
    .filter((item): item is Item => item !== undefined);

  return (
    <View style={styles.container}>
      <Title size="large" style={styles.title}>Odd One Out</Title>
      <Body size="large" style={styles.question}>{exercise.question}</Body>

      <TryAgainModal 
        visible={showTryAgain} 
        onClose={() => setShowTryAgain(false)} 
      />
      
      <View style={styles.content}>
        <View style={styles.grid}>
          {exerciseItems.map((item) => {
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
                    <Image
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
    justifyContent: 'center',
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
    marginBottom: 32,
    maxWidth: '80%',
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

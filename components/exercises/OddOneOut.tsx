import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Exercise, items } from '../../data/data';

interface OddOneOutProps {
  exercise: Exercise;
  onComplete: () => void;
}

export default function OddOneOut({ exercise, onComplete }: OddOneOutProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Get items for this exercise
  const exerciseItems = exercise.optionIds
    .map(id => items.find(item => item.id === id))
    .filter(item => item !== undefined);

  const handleSelect = (itemId: number) => {
    setSelectedId(itemId);
    
    // Check if the selected answer is correct
    if (itemId === exercise.answerId) {
      setIsCorrect(true);
      // Call onComplete to enable Next button
      onComplete();
    } else {
      setIsCorrect(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Odd One Out</Text>
      <Text style={styles.question}>{exercise.question}</Text>
      
      <View style={styles.content}>
        <View style={styles.grid}>
          {exerciseItems.map((item, index) => {
            if (!item) return null;
            
            const itemId = item.id;
            const isSelected = selectedId === itemId;
            const showFeedback = isSelected && isCorrect !== null;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.imageCard,
                  isSelected && styles.imageCardSelected,
                  showFeedback && isCorrect && styles.imageCardCorrect,
                  showFeedback && !isCorrect && styles.imageCardWrong,
                ]}
                onPress={() => !isCorrect && handleSelect(itemId)}
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
    padding: 20,
  },
  title: {
    fontFamily: 'FredokaOne',
    fontSize: 28,
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 16,
  },
  question: {
    fontFamily: 'BalsamiqSans',
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
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
    borderWidth: 3,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    transform: [{ rotate: '3deg' }], // Slight shake effect visually
  },
  image: {
    width: '100%',
    height: '100%', // Full height since no text
  },
  // Removed itemWord style
  feedbackCorrect: {
    fontFamily: 'FredokaOne', // More playful font
    fontSize: 24,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(76, 175, 80, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  feedbackWrong: {
    fontFamily: 'BalsamiqSans',
    fontSize: 20,
    fontWeight: '700',
    color: '#FF5252',
    textAlign: 'center',
    marginTop: 10,
  },
});

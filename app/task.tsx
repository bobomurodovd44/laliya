import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LookAndSay from '../components/exercises/LookAndSay';
import OddOneOut from '../components/exercises/OddOneOut';
import PicturePuzzle from '../components/exercises/PicturePuzzle';
import ShapeMatch from '../components/exercises/ShapeMatch';
import { Exercise, ExerciseType, exercises } from '../data/data';

export default function Task() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const stageId = Number(params.stageId);
  const exerciseOrder = Number(params.exerciseOrder) || 1;
  
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [stageExercises, setStageExercises] = useState<Exercise[]>([]);
  const [isLastExercise, setIsLastExercise] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Get all exercises for this stage
    const exercisesInStage = exercises
      .filter(ex => ex.stageId === stageId)
      .sort((a, b) => a.order - b.order);
    
    setStageExercises(exercisesInStage);
    
    // Find current exercise
    const exercise = exercisesInStage.find(ex => ex.order === exerciseOrder);
    setCurrentExercise(exercise || null);
    
    // Check if this is the last exercise
    const isLast = exerciseOrder >= exercisesInStage.length;
    setIsLastExercise(isLast);
    
    // Reset completion state when exercise changes
    setIsCompleted(false);
  }, [stageId, exerciseOrder]);

  const getExerciseTypeText = (type: ExerciseType): string => {
    switch (type) {
      case ExerciseType.ODD_ONE_OUT:
        return 'Odd One Out';
      case ExerciseType.LOOK_AND_SAY:
        return 'Look and Say';
      case ExerciseType.SHAPE_MATCH:
        return 'Shape Match';
      case ExerciseType.PICTURE_PUZZLE:
        return 'Picture Puzzle';
      default:
        return 'Unknown Exercise';
    }
  };

  const handleComplete = () => {
    setIsCompleted(true);
  };

  const renderExercise = () => {
    if (!currentExercise) return null;

    switch (currentExercise.type) {
      case ExerciseType.ODD_ONE_OUT:
        return <OddOneOut exercise={currentExercise} onComplete={handleComplete} />;
      case ExerciseType.LOOK_AND_SAY:
        return <LookAndSay exercise={currentExercise} onComplete={handleComplete} />;
      case ExerciseType.SHAPE_MATCH:
        return <ShapeMatch exercise={currentExercise} onComplete={handleComplete} />;
      case ExerciseType.PICTURE_PUZZLE:
        return <PicturePuzzle exercise={currentExercise} onComplete={handleComplete} />;
      default:
        return <Text style={styles.errorText}>Unknown exercise type</Text>;
    }
  };

  const handleNext = () => {
    if (!isLastExercise) {
      router.push(`/task?stageId=${stageId}&exerciseOrder=${exerciseOrder + 1}`);
    }
  };

  const handleSubmit = () => {
    router.push('/');
  };

  if (!currentExercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Exercise not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header} />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(exerciseOrder / stageExercises.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderExercise()}
      </View>

      {/* Navigation Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {isLastExercise ? (
          <TouchableOpacity 
            style={[styles.button, styles.submitButton, !isCompleted && styles.buttonDisabled]} 
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!isCompleted}
          >
            <Text style={[styles.buttonText, !isCompleted && styles.buttonTextDisabled]}>Submit</Text>
            <Ionicons name="checkmark-circle" size={24} color={isCompleted ? "#FFFFFF" : "#999"} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.nextButton, !isCompleted && styles.buttonDisabled]} 
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={!isCompleted}
          >
            <Text style={[styles.buttonText, !isCompleted && styles.buttonTextDisabled]}>Next</Text>
            <Ionicons name="arrow-forward" size={24} color={isCompleted ? "#FFFFFF" : "#999"} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E8',
  },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
  },
  exerciseType: {
    fontFamily: 'FredokaOne',
    fontSize: 32,
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 24,
  },
  question: {
    fontFamily: 'BalsamiqSans',
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
    gap: 8,
  },
  infoText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  scoreText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C00',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButton: {
    backgroundColor: '#4A90E2',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#FFE4CC',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 3,
  },
  errorText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 18,
    color: '#FF0000',
    textAlign: 'center',
    padding: 20,
  },
});

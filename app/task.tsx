import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedBackground from '../components/AnimatedBackground';
import { DuoButton } from '../components/DuoButton';
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
  
  const confettiLeftRef = useRef<ConfettiCannon>(null);
  const confettiRightRef = useRef<ConfettiCannon>(null);
  const confettiCenterRef = useRef<ConfettiCannon>(null);
  const confettiRainRef = useRef<ConfettiCannon>(null);

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
    
    // Fire ALL cannons for a mega celebration!
    confettiLeftRef.current?.start();
    confettiRightRef.current?.start();
    setTimeout(() => {
       confettiCenterRef.current?.start();
    }, 300);
    setTimeout(() => {
       confettiRainRef.current?.start();
    }, 600);
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
      <AnimatedBackground />
      
      {/* Progress Bar (Header removed) */}
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
          <DuoButton
            title="Submit"
            onPress={handleSubmit}
            color="green"
            size="medium"
            disabled={!isCompleted}
          />
        ) : (
          <DuoButton
            title="Next"
            onPress={handleNext}
            color="green" 
            size="medium"
            disabled={!isCompleted}
          />
        )}
      </View>

      <ConfettiCannon
        ref={confettiLeftRef}
        count={50}
        origin={{x: 0, y: Dimensions.get('window').height}}
        autoStart={false}
        fadeOut={true}
        explosionSpeed={350}
        fallSpeed={3000}
      />
      <ConfettiCannon
        ref={confettiRightRef}
        count={50}
        origin={{x: Dimensions.get('window').width, y: Dimensions.get('window').height}}
        autoStart={false}
        fadeOut={true}
        explosionSpeed={350}
        fallSpeed={3000}
      />
      
      {/* Center Explosion */}
      <ConfettiCannon
        ref={confettiCenterRef}
        count={100}
        origin={{x: Dimensions.get('window').width / 2, y: Dimensions.get('window').height / 2}}
        autoStart={false}
        fadeOut={true}
        explosionSpeed={600}
        fallSpeed={3000}
      />

      {/* Rain from Top */}
      <ConfettiCannon
        ref={confettiRainRef}
        count={100}
        origin={{x: Dimensions.get('window').width / 2, y: -20}}
        autoStart={false}
        fadeOut={true}
        explosionSpeed={0}
        fallSpeed={4000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Make transparent so background shows
  },
  // Header style removed
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    fontSize: 24, // Increased from 18
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  progressBar: {
    height: 16, 
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8C00', // Changed to Orange
    borderRadius: 12,
  },
  errorText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 18,
    color: '#FF0000',
    textAlign: 'center',
    padding: 20,
  },
});

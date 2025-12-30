import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DuoButton } from "../components/DuoButton";
import LookAndSay from "../components/exercises/LookAndSay";
import OddOneOut from "../components/exercises/OddOneOut";
import PicturePuzzle from "../components/exercises/PicturePuzzle";
import ShapeMatch from "../components/exercises/ShapeMatch";
import { PageContainer } from "../components/layout/PageContainer";
import { ProgressBar } from "../components/ProgressBar";
import { Body } from "../components/Typography";
import { Colors, Spacing } from "../constants";
import { Exercise, ExerciseType, exercises } from "../data/data";

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
  const [resetKey, setResetKey] = useState(0);
  const confettiRef = useRef<ConfettiCannon>(null);

  useEffect(() => {
    const exercisesInStage = exercises
      .filter((ex) => ex.stageId === stageId)
      .sort((a, b) => a.order - b.order);

    setStageExercises(exercisesInStage);

    const exercise = exercisesInStage.find((ex) => ex.order === exerciseOrder);
    setCurrentExercise(exercise || null);

    const isLast = exerciseOrder >= exercisesInStage.length;
    setIsLastExercise(isLast);

    setIsCompleted(false);
  }, [stageId, exerciseOrder]);

  useFocusEffect(
    useCallback(() => {
      setResetKey((prev) => prev + 1);
      setIsCompleted(false);
    }, [])
  );

  const handleComplete = useCallback(() => {
    setIsCompleted(true);

    if (currentExercise?.type !== ExerciseType.LOOK_AND_SAY) {
      confettiRef.current?.start();
    }
  }, [currentExercise]);

  const renderExercise = () => {
    if (!currentExercise) return null;

    switch (currentExercise.type) {
      case ExerciseType.ODD_ONE_OUT:
        return (
          <OddOneOut exercise={currentExercise} onComplete={handleComplete} />
        );
      case ExerciseType.LOOK_AND_SAY:
        return (
          <LookAndSay exercise={currentExercise} onComplete={handleComplete} />
        );
      case ExerciseType.SHAPE_MATCH:
        return (
          <ShapeMatch
            key={resetKey}
            exercise={currentExercise}
            onComplete={handleComplete}
          />
        );
      case ExerciseType.PICTURE_PUZZLE:
        return (
          <PicturePuzzle
            exercise={currentExercise}
            onComplete={handleComplete}
          />
        );
      default:
        return <Body style={styles.errorText}>Unknown exercise type</Body>;
    }
  };

  const handleNext = useCallback(() => {
    if (!isLastExercise) {
      router.push(
        `/task?stageId=${stageId}&exerciseOrder=${exerciseOrder + 1}`
      );
    }
  }, [isLastExercise, stageId, exerciseOrder, router]);

  const handleSubmit = useCallback(() => {
    router.push("/");
  }, [router]);

  const progress =
    stageExercises.length > 0 ? exerciseOrder / stageExercises.length : 0;

  if (!currentExercise) {
    return (
      <PageContainer>
        <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
          <Body style={styles.errorText}>Exercise not found</Body>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer useAnimatedBackground>
      <View
        style={[
          styles.progressContainer,
          { paddingTop: insets.top + Spacing.padding.md },
        ]}
      >
        <ProgressBar progress={progress} />
      </View>

      <View style={styles.content}>{renderExercise()}</View>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, Spacing.padding.lg) },
        ]}
      >
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
        ref={confettiRef}
        count={200}
        origin={{ x: Dimensions.get("window").width / 2, y: -10 }}
        autoStart={false}
        fadeOut={true}
        explosionSpeed={0}
        fallSpeed={3500}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    width: "100%",
    paddingHorizontal: Spacing.padding.lg,
    paddingVertical: Spacing.padding.lg,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.padding.lg,
  },
  footer: {
    padding: Spacing.padding.lg,
    paddingBottom: Spacing.padding.xxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: Spacing.size.icon.medium,
    color: Colors.error,
    textAlign: "center",
    padding: Spacing.padding.lg,
  },
});

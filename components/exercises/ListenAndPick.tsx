import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { Exercise, Item } from "../../data/data";
import { useAudioCache } from "../../hooks/useAudioCache";
import { items } from "../../lib/items-store";
import { useTranslation } from "../../lib/localization";
import ImageWithLoader from "../common/ImageWithLoader";
import { DuoButton } from "../DuoButton";
import TryAgainModal from "../TryAgainModal";
import { Body, Title } from "../Typography";

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

export default React.memo(function ListenAndPick({
  exercise,
  onComplete,
}: ListenAndPickProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shuffledItems, setShuffledItems] = useState<Item[]>([]);
  const { play: playAudio, isPlaying } = useAudioCache();
  const [showTryAgainModal, setShowTryAgainModal] = useState(false);
  const [tryCount, setTryCount] = useState(0);

  // Guard to prevent multiple onComplete calls
  const isCompletedRef = useRef(false);

  // Ref to track if component is unmounting to avoid false errors
  const isUnmountingRef = useRef(false);

  // Get answer item
  const answerItem = items.find((i) => i.id === exercise.answerId);

  // Create stable exercise identifier
  const exerciseId = `${exercise.stageId}-${exercise.order}`;

  useEffect(() => {
    isUnmountingRef.current = false;
    return () => {
      isUnmountingRef.current = true;
    };
  }, []);

  const playQuestionAudio = async () => {
    if (!exercise.questionAudioUrl || isPlaying) return;
    await playAudio(exercise.questionAudioUrl);
  };

  // Shuffle items when exercise changes
  useEffect(() => {
    const currentExerciseItems = exercise.optionIds
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is Item => item !== undefined);

    // Reset state
    setSelectedId(null);
    setIsCorrect(null);
    setTryCount(0);
    isCompletedRef.current = false;

    // Only shuffle if we have items
    if (currentExerciseItems.length === 0) {
      setShuffledItems([]);
      return;
    }

    // Shuffle items - ensure different order each time
    let shuffled = shuffleArray(currentExerciseItems);
    let attempts = 0;
    const maxAttempts = 10;
    while (
      attempts < maxAttempts &&
      shuffled.every(
        (item, index) => item.id === currentExerciseItems[index]?.id
      )
    ) {
      shuffled = shuffleArray(currentExerciseItems);
      attempts++;
    }

    setShuffledItems(shuffled);
  }, [exercise.optionIds]);

  const playAnswerAudio = async () => {
    const audioUrl = answerItem?.audioUrl;
    if (!audioUrl || audioUrl.trim() === "" || isPlaying) return;
    await playAudio(audioUrl);
  };

  const handleSelect = useCallback(
    (itemId: number) => {
      // If already completed, do nothing
      if (isCorrect === true || isCompletedRef.current) return;

      setSelectedId(itemId);

      if (itemId === exercise.answerId) {
        // Mark as completed immediately to prevent multiple calls
        isCompletedRef.current = true;
        setIsCorrect(true);
        // Haptic feedback removed for core logic but could be added back
        
        // Use a small delay before completing to let user see success state
        setTimeout(() => {
            onComplete();
        }, 800);
      } else {
        setIsCorrect(false);
        // Show try again modal instead of completing the exercise
        setShowTryAgainModal(true);
        setTryCount(prev => prev + 1);
      }
    },
    [isCorrect, exercise.answerId, onComplete]
  );

  return (
    <View style={styles.container}>
      <Title size="small" style={styles.title}>
        {t("exercise.listenAndPick")}
      </Title>
      <View style={styles.questionContainer}>
        <Body size="large" style={styles.question}>
          {exercise.question}
        </Body>
        {exercise.questionAudioUrl && (
          <DuoButton
            title=""
            onPress={playQuestionAudio}
            color="blue"
            size="medium"
            customSize={54}
            style={styles.audioButton}
            icon="volume-high"
            shape="circle"
            iconSize={26}
          />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.grid}>
          {shuffledItems.map((item) => {
            const isSelected = selectedId === item.id;
            const isCorrectOption = item.id === exercise.answerId;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.imageCard,
                  isSelected && isCorrect === true && styles.imageCardCorrect,
                  isSelected && isCorrect === false && styles.imageCardWrong,
                ]}
                onPress={() => handleSelect(item.id)}
                activeOpacity={0.7}
                disabled={isCorrect === true}
              >
                {item.imageUrl && (
                  <View style={styles.imageWrapper}>
                    <ImageWithLoader
                      source={{ uri: item.imageUrl }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Try Again Modal */}
      <TryAgainModal
        visible={showTryAgainModal}
        onClose={() => {
          setShowTryAgainModal(false);
          setSelectedId(null);
          setIsCorrect(null);
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  title: {
    color: "#FF1493",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 0,
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 12,
    width: "100%",
  },
  question: {
    color: "#666",
    textAlign: "center",
    maxWidth: "80%",
    fontSize: 28,
  },
  audioButton: {
    // Styling for audio button
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    width: "100%",
    maxWidth: 380,
  },
  imageCard: {
    width: "45%",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageCardCorrect: {
    borderColor: "#58CC02",
    borderWidth: 6,
    backgroundColor: "#E6FFFA",
  },
  imageCardWrong: {
    borderColor: "#FFC107",
    borderWidth: 6,
    backgroundColor: "#FFF9C4",
  },
  correctOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 10,
  },
});

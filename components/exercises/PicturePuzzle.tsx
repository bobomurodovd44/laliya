import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Exercise } from "../../data/data";
import { items } from "../../lib/items-store";
import { useTranslation } from "../../lib/localization";
import { Body, Title } from "../Typography";

interface PicturePuzzleProps {
  exercise: Exercise;
  onComplete: () => void;
}

// 2x2 Grid = 4 pieces
const GRID_SIZE = 2;
const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTAINER_PADDING = 20;
const BOARD_SIZE = Math.min(SCREEN_WIDTH - CONTAINER_PADDING * 2, 320);
const PIECE_SIZE = BOARD_SIZE / GRID_SIZE;

const PIECES_CONFIG = [
  { id: 0, r: 0, c: 0 },
  { id: 1, r: 0, c: 1 },
  { id: 2, r: 1, c: 0 },
  { id: 3, r: 1, c: 1 },
];

export default React.memo(function PicturePuzzle({
  exercise,
  onComplete,
}: PicturePuzzleProps) {
  const { t } = useTranslation();
  // Get the first option ID from optionIds array
  const firstOptionId = exercise.optionIds?.[0];

  // Validate that optionIds exists and has at least one element
  if (
    !exercise.optionIds ||
    exercise.optionIds.length === 0 ||
    firstOptionId === undefined
  ) {
    return (
      <View style={styles.container}>
        <Body style={styles.question}>{t('exercise.noOptionsAvailable')}</Body>
      </View>
    );
  }

  // Find the item using the first optionId
  const item = items.find((i) => i.id === firstOptionId);

  if (!item?.imageUrl) {
    return (
      <View style={styles.container}>
        <Body style={styles.question}>{t('exercise.imageNotFound')}</Body>
      </View>
    );
  }

  return (
    <PuzzleLogic
      key={item.imageUrl}
      imageUrl={item.imageUrl}
      onSolved={onComplete}
      question={exercise.question}
    />
  );
});

function PuzzleLogic({
  imageUrl,
  onSolved,
  question,
}: {
  imageUrl: string;
  onSolved: () => void;
  question: string;
}) {
  const { t } = useTranslation();
  // Guard to prevent multiple onSolved calls
  const isSolvedRef = useRef(false);

  // Fisher-Yates shuffle algorithm for true randomization
  const shuffleArray = (array: number[]): number[] => {
    const shuffled = [...array]; // Create a copy to avoid mutating
    let currentIndex = shuffled.length,
      randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[currentIndex],
      ];
    }
    return shuffled;
  };

  // Create a fresh shuffle each time the component mounts
  const [piecesPlacement, setPiecesPlacement] = useState<number[]>(() => {
    // Generate fresh random shuffle on every mount
    let slots = shuffleArray([0, 1, 2, 3]);

    // Check if solved (all equal to index) - if so, reshuffle
    let attempts = 0;
    while (slots.every((val, index) => val === index) && attempts < 10) {
      slots = shuffleArray([0, 1, 2, 3]);
      attempts++;
    }

    // Final safety check - if still solved, force swap first two
    if (slots.every((val, index) => val === index)) {
      [slots[0], slots[1]] = [slots[1], slots[0]];
    }

    return slots;
  });

  const isSolved = useMemo(() => {
    if (piecesPlacement.length === 0) return false;
    return piecesPlacement.every((slotIndex, pieceId) => slotIndex === pieceId);
  }, [piecesPlacement]);

  useEffect(() => {
    if (isSolved && !isSolvedRef.current) {
      // Mark as solved immediately
      isSolvedRef.current = true;

      // Call onSolved asynchronously to prevent blocking
      requestAnimationFrame(() => {
        onSolved();
      });
    }
  }, [isSolved, onSolved]);

  // Reset guard when puzzle resets (if needed)
  useEffect(() => {
    if (!isSolved) {
      isSolvedRef.current = false;
    }
  }, [isSolved]);

  // Generate fresh shuffle when imageUrl changes
  useEffect(() => {
    // Generate fresh random shuffle when image changes
    let slots = shuffleArray([0, 1, 2, 3]);

    // Check if solved (all equal to index) - if so, reshuffle
    let attempts = 0;
    while (slots.every((val, index) => val === index) && attempts < 10) {
      slots = shuffleArray([0, 1, 2, 3]);
      attempts++;
    }

    // Final safety check - if still solved, force swap first two
    if (slots.every((val, index) => val === index)) {
      [slots[0], slots[1]] = [slots[1], slots[0]];
    }

    setPiecesPlacement(slots);
    isSolvedRef.current = false; // Reset solved state when image changes
  }, [imageUrl]);

  const handleDrop = useCallback((draggedPieceId: number, targetSlotIndex: number) => {
    setPiecesPlacement((prev) => {
      const newPlacement = [...prev];

      // Find if any piece is currently at the target slot
      const existingPieceId = newPlacement.findIndex(
        (slot) => slot === targetSlotIndex
      );
      const oldSlotOfDraggedPiece = newPlacement[draggedPieceId];

      if (existingPieceId !== -1 && existingPieceId !== draggedPieceId) {
        // SWAP: Move the existing piece to the dragged piece's old slot
        newPlacement[existingPieceId] = oldSlotOfDraggedPiece;
      }

      // Move dragged piece to target slot
      newPlacement[draggedPieceId] = targetSlotIndex;

      return newPlacement;
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Title size="medium" style={styles.title}>
        {t('exercise.picturePuzzle')}
      </Title>
      <Body style={styles.question}>{question}</Body>

      {/* Board Container */}
      <View
        style={[
          styles.board,
          { width: BOARD_SIZE, height: BOARD_SIZE },
          // Clip overflow ONLY when solved, so we get rounded corners on final image
          { overflow: isSolved ? "hidden" : "visible" },
        ]}
      >
        {/* Render Pieces */}
        {PIECES_CONFIG.map((piece, i) => (
          <DraggablePiece
            key={piece.id}
            id={piece.id}
            correctRow={piece.r}
            correctCol={piece.c}
            currentSlot={piecesPlacement[piece.id]}
            imageUrl={imageUrl}
            onDrop={handleDrop}
            enabled={!isSolved}
            isCorrect={piecesPlacement[piece.id] === piece.id}
          />
        ))}
      </View>
    </View>
  );
}

const DraggablePiece = React.memo(({
  id,
  correctRow,
  correctCol,
  currentSlot,
  imageUrl,
  onDrop,
  enabled,
  isCorrect,
}: {
  id: number;
  correctRow: number;
  correctCol: number;
  currentSlot: number;
  imageUrl: string;
  onDrop: (pieceId: number, slotIndex: number) => void;
  enabled: boolean;
  isCorrect: boolean;
}) => {
  // Calculate target position based on currentSlot
  const destX = (currentSlot % 2) * PIECE_SIZE;
  const destY = Math.floor(currentSlot / 2) * PIECE_SIZE;

  const tx = useSharedValue(destX);
  const ty = useSharedValue(destY);
  const ctx = useSharedValue({ x: 0, y: 0 });
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const isCorrectSv = useSharedValue(isCorrect);

  useEffect(() => {
    isCorrectSv.value = isCorrect;
  }, [isCorrect]);

  // Reactive Position: If parent moves us (e.g. swap), animate to new spot
  // checking !isDragging to avoid fighting the user
  useEffect(() => {
    tx.value = withSpring(destX, { damping: 15 });
    ty.value = withSpring(destY, { damping: 15 });
  }, [destX, destY]);

  // Dynamic Z-Index:
  // - Dragging: 100
  // - Incorrect: 10 (Float above correctly placed ones)
  // - Correct: 1 (Sits at the bottom)
  const z = useDerivedValue(() => {
    if (isDragging.value) return 100;
    return isCorrectSv.value ? 1 : 10;
  });

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(enabled)
      .onStart(() => {
        ctx.value = { x: tx.value, y: ty.value };
        scale.value = withSpring(1.03);
        isDragging.value = true;
      })
      .onUpdate((e) => {
        tx.value = e.translationX + ctx.value.x;
        ty.value = e.translationY + ctx.value.y;
      })
      .onEnd(() => {
        scale.value = withSpring(1);
        isDragging.value = false;

        const currentX = tx.value;
        const currentY = ty.value;

        let bestSlot = -1;
        let minDist = 10000;

        for (let i = 0; i < 4; i++) {
          const sr = Math.floor(i / 2);
          const sc = i % 2;
          const sx = sc * PIECE_SIZE;
          const sy = sr * PIECE_SIZE;

          const pieceCenterX = currentX + PIECE_SIZE / 2;
          const pieceCenterY = currentY + PIECE_SIZE / 2;
          const slotCenterX = sx + PIECE_SIZE / 2;
          const slotCenterY = sy + PIECE_SIZE / 2;

          const dist = Math.sqrt(
            Math.pow(pieceCenterX - slotCenterX, 2) +
              Math.pow(pieceCenterY - slotCenterY, 2)
          );

          if (dist < PIECE_SIZE * 0.5) {
            if (dist < minDist) {
              minDist = dist;
              bestSlot = i;
            }
          }
        }

        if (bestSlot !== -1) {
          const sr = Math.floor(bestSlot / 2);
          const sc = bestSlot % 2;
          // Snap visually immediately for better feeling
          tx.value = withSpring(sc * PIECE_SIZE, { damping: 15 });
          ty.value = withSpring(sr * PIECE_SIZE, { damping: 15 });
          runOnJS(onDrop)(id, bestSlot);
        } else {
          // Snap back to START if no valid drop
          tx.value = withSpring(ctx.value.x, { damping: 15 });
          ty.value = withSpring(ctx.value.y, { damping: 15 });
        }
      });
  }, [enabled, id, onDrop]);

  const animatedStyle = useAnimatedStyle(() => {
    const dragging = isDragging.value;
    const zVal = z.value;
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { scale: scale.value },
      ],
      zIndex: zVal,
      position: "absolute",
      top: 0,
      left: 0,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: dragging ? 10 : 2,
      },
      shadowOpacity: dragging ? 0.4 : 0.15,
      shadowRadius: dragging ? 12 : 3,
      elevation: dragging ? 15 : zVal === 1 ? 1 : 5,
    };
  });

  const innerStyle = {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    transform: [
      { translateX: -correctCol * PIECE_SIZE },
      { translateY: -correctRow * PIECE_SIZE },
    ],
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.pieceContainer, animatedStyle]}>
        <View style={enabled ? styles.activePiece : styles.lockedPiece}>
          <Image
            source={{ uri: imageUrl }}
            style={innerStyle}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            recyclingKey={`puzzle-${id}`}
          />
          {enabled && <View style={styles.borderOverlay} />}
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontFamily: "FredokaOne",
    fontSize: 28,
    color: "#FF1493",
    marginBottom: 8,
  },
  question: {
    fontFamily: "BalsamiqSans",
    fontSize: 20,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  board: {
    backgroundColor: "#F0F0F0",
    borderRadius: 16,
    borderWidth: 0,
    position: "relative",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  pieceContainer: {
    width: PIECE_SIZE,
    height: PIECE_SIZE,
    // Removed padding to eliminate gaps
  },
  activePiece: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#FFF",
    borderRadius: 8,
  },
  lockedPiece: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: 0, // Zero radius to join seamlessly
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 8,
    zIndex: 10,
  },
});

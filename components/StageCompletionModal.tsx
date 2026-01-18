import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import ConfettiCannon from "react-native-confetti-cannon";
import { Colors } from "../constants/Colors";
import { Spacing } from "../constants/Spacing";
import { Typography } from "../constants/Typography";
import { useTranslation } from "../lib/localization";
import { DuoButton } from "./DuoButton";
import { playSound } from "../lib/sound";

interface StageCompletionModalProps {
  visible: boolean;
  stageOrder?: number;
  nextStageId?: string | null;
  isLastStage?: boolean;
  onNextStage: () => void;
  onGoHome: () => void;
}

export default function StageCompletionModal({
  visible,
  stageOrder,
  nextStageId,
  isLastStage = false,
  onNextStage,
  onGoHome,
}: StageCompletionModalProps) {
  const { t } = useTranslation();
  const confettiRef = useRef<ConfettiCannon>(null);
  const translateY = useSharedValue(100);

  useEffect(() => {
    if (visible) {
      playSound("correct");
      confettiRef.current?.start();
      translateY.value = withSpring(0, { damping: 15 });
    } else {
      translateY.value = 100;
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <Animated.View style={[styles.overlay, overlayStyle]} entering={FadeIn.duration(200)}>
        <Animated.View style={[styles.modalCard, cardStyle]}>
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={60} color="#FFD700" />
          </View>

          <Text style={styles.title}>{t("exercise.stageComplete")}</Text>
          <Text style={styles.subtitle}>
            {stageOrder
              ? t("exercise.stageCompleted", { stage: stageOrder })
              : t("exercise.stageCompletedGeneric")}
          </Text>

          <View style={styles.buttonContainer}>
            {!isLastStage && nextStageId && (
              <DuoButton
                title={t("common.continueNextStage")}
                onPress={onNextStage}
                color="green"
                size="medium"
                icon="arrow-forward"
                iconSize={24}
              />
            )}

            <DuoButton
              title={t("common.goHome")}
              onPress={onGoHome}
              color="blue"
              size="medium"
              icon="home"
              iconSize={24}
            />
          </View>
        </Animated.View>

        <ConfettiCannon
          ref={confettiRef}
          count={50}
          origin={{ x: Dimensions.get("window").width / 2, y: -50 }}
          autoStart={false}
          fadeOut={true}
          explosionSpeed={0}
          fallSpeed={2500}
          colors={["#FFD700", "#58CC02", "#4ECDC4"]}
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.xxl,
    padding: Spacing.padding.xxl,
    alignItems: "center",
    ...Spacing.shadow.large,
    borderWidth: 3,
    borderColor: Colors.success,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF9E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.margin.lg,
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.huge,
    color: Colors.success,
    textAlign: "center",
    marginBottom: Spacing.margin.sm,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.secondary,
    fontSize: Typography.fontSize.xxl,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: Typography.fontSize.xxl * Typography.lineHeight.normal,
    marginBottom: Spacing.margin.xl,
  },
  buttonContainer: {
    width: "100%",
    gap: Spacing.margin.md,
  },
});

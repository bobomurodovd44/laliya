import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../constants';
import { BackButton } from '../BackButton';
import { ProgressBar } from '../ProgressBar';

interface PageHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: ReactNode;
  showProgress?: boolean;
  progress?: number;
  style?: ViewStyle;
}

export const PageHeader = React.memo<PageHeaderProps>(
  ({
    title,
    showBackButton = false,
    onBackPress,
    rightAction,
    showProgress = false,
    progress = 0,
    style,
  }) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const handleBackPress = () => {
      if (onBackPress) {
        onBackPress();
      } else {
        router.back();
      }
    };

    return (
      <View style={[styles.container, { paddingTop: insets.top + 10 }, style]}>
        {showBackButton ? (
          <BackButton onPress={handleBackPress} />
        ) : (
          <View style={styles.spacer} />
        )}

        {showProgress ? (
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} />
          </View>
        ) : title ? (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : (
          <View style={styles.spacer} />
        )}

        {rightAction || <View style={styles.spacer} />}
      </View>
    );
  }
);

PageHeader.displayName = 'PageHeader';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.padding.lg,
    paddingBottom: Spacing.padding.md,
    zIndex: 10,
  },
  spacer: {
    width: 45,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: Spacing.margin.md,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});



import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedBackground from '../AnimatedBackground';
import { Colors } from '../../constants';
import { FloatingShapesBackground } from './FloatingShapesBackground';

interface PageContainerProps {
  children: ReactNode;
  backgroundColor?: string;
  useAnimatedBackground?: boolean;
  useFloatingShapes?: boolean;
  floatingShapesCount?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const PageContainer = React.memo<PageContainerProps>(
  ({
    children,
    backgroundColor = Colors.background,
    useAnimatedBackground = false,
    useFloatingShapes = false,
    floatingShapesCount = 5,
    style,
    contentStyle,
  }) => {
    const insets = useSafeAreaInsets();

    return (
      <View style={[styles.container, { backgroundColor }, style]}>
        {useAnimatedBackground && <AnimatedBackground />}
        {useFloatingShapes && (
          <FloatingShapesBackground shapeCount={floatingShapesCount} />
        )}
        {!useAnimatedBackground && !useFloatingShapes && (
          <View style={[styles.backgroundLayer, { backgroundColor }]} />
        )}
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    );
  }
);

PageContainer.displayName = 'PageContainer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});


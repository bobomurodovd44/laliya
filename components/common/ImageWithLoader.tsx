import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants';

interface ImageWithLoaderProps {
  source: { uri: string } | number;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scaleDown';
  tintColor?: string;
  priority?: 'high' | 'normal' | 'low';
  onLoad?: () => void;
  onError?: () => void;
}

export default function ImageWithLoader({
  source,
  style,
  resizeMode = 'cover',
  contentFit,
  tintColor,
  priority = 'normal',
  onLoad,
  onError,
}: ImageWithLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const opacity = useSharedValue(0);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = React.useRef(true);

  // Determine if source is a URI (remote) or require (local)
  const isRemote = typeof source === 'object' && 'uri' in source;
  
  // Validate URL if remote
  const isValidUrl = isRemote && source.uri 
    ? (source.uri.startsWith('http://') || source.uri.startsWith('https://') || source.uri.startsWith('file://'))
    : true;
  
  // Generate recycling key from URL for better memory management
  const recyclingKey = isRemote && source.uri 
    ? `img_${source.uri.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}`
    : undefined;

  useEffect(() => {
    // Reset states when source changes
    isLoadingRef.current = true;
    setIsLoading(true);
    setHasError(false);
    opacity.value = 0;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set timeout for loading (10 seconds for remote images)
    if (isRemote && isValidUrl) {
      timeoutRef.current = setTimeout(() => {
        if (isLoadingRef.current) {
          isLoadingRef.current = false;
          setIsLoading(false);
          setHasError(true);
          onError?.();
        }
      }, 10000); // 10 second timeout
    } else if (isRemote && !isValidUrl) {
      // Invalid URL - immediately show error
      isLoadingRef.current = false;
      setIsLoading(false);
      setHasError(true);
      onError?.();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isRemote ? source.uri : source, isValidUrl, onError]);

  const handleLoad = () => {
    // Clear timeout on successful load
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isLoadingRef.current = false;
    setIsLoading(false);
    opacity.value = withTiming(1, { duration: 300 });
    onLoad?.();
  };

  const handleError = () => {
    // Clear timeout on error
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isLoadingRef.current = false;
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Get dimensions from style for skeleton
  const imageStyle = StyleSheet.flatten(style || {});
  const skeletonStyle = {
    width: imageStyle.width || '100%',
    height: imageStyle.height || '100%',
    backgroundColor: Colors.backgroundDark || '#F0F0F0',
    borderRadius: imageStyle.borderRadius || 0,
  };

  return (
    <View style={[style, { position: 'relative', overflow: 'hidden', backgroundColor: 'transparent' }]}>
      {/* Skeleton/Loading Placeholder */}
      {isLoading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            skeletonStyle,
            {
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1,
            },
          ]}
        >
          <ActivityIndicator size="small" color={Colors.primary || '#4DA6FF'} />
        </View>
      )}

      {/* Error Placeholder */}
      {hasError && !isLoading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            skeletonStyle,
            {
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1,
            },
          ]}
        />
      )}

      {/* Actual Image - only render if URL is valid or local */}
      {(isValidUrl || !isRemote) && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, { backgroundColor: 'transparent' }]}>
          <Image
            source={source}
            style={StyleSheet.absoluteFill}
            contentFit={contentFit || resizeMode}
            tintColor={tintColor}
            onLoad={handleLoad}
            onError={handleError}
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={recyclingKey}
            allowDownscaling={true}
            priority={priority}
            placeholderContentFit="cover"
          />
        </Animated.View>
      )}
    </View>
  );
}


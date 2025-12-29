import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface LessonCard {
  id: number;
  title: string;
  stars: number;
  positionStyle: any;
  isActive?: boolean;
}

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mascotAnim = useRef(new Animated.Value(0)).current;
  
  // Animated shapes
  const shape1Anim = useRef(new Animated.Value(0)).current;
  const shape2Anim = useRef(new Animated.Value(0)).current;
  const shape3Anim = useRef(new Animated.Value(0)).current;
  const shape4Anim = useRef(new Animated.Value(0)).current;
  const shape5Anim = useRef(new Animated.Value(0)).current;
  
  const currentLesson = 3; // Current lesson card
  
  // Animate mascot bouncing
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotAnim, {
          toValue: -10,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(mascotAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Animate floating shapes
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape1Anim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(shape1Anim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape2Anim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(shape2Anim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape3Anim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(shape3Anim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape4Anim, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: true,
        }),
        Animated.timing(shape4Anim, {
          toValue: 0,
          duration: 4500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape5Anim, {
          toValue: 1,
          duration: 5500,
          useNativeDriver: true,
        }),
        Animated.timing(shape5Anim, {
          toValue: 0,
          duration: 5500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const lessons: LessonCard[] = [
    {
      id: 1,
      title: 'Animal Sounds',
      stars: 3,
      positionStyle: { top: 20, right: '5%' },
    },
    {
      id: 2,
      title: 'First Words',
      stars: 2,
      positionStyle: { top: 160, left: '8%' },
    },
    {
      id: 3,
      title: 'Colors',
      stars: 0,
      positionStyle: { top: 300, right: '10%' },
      isActive: true,
    },
    {
      id: 4,
      title: 'Numbers',
      stars: 0,
      positionStyle: { top: 440, left: '5%' },
    },
    {
      id: 5,
      title: 'Shapes',
      stars: 0,
      positionStyle: { top: 580, right: '8%' },
    },
    {
      id: 6,
      title: 'Body Parts',
      stars: 0,
      positionStyle: { top: 720, left: '10%' },
    },
    {
      id: 7,
      title: 'Emotions',
      stars: 0,
      positionStyle: { top: 860, right: '6%' },
    },
  ];

  const StarRating = ({ count }: { count: number }) => (
    <View style={styles.starContainer}>
      {[1, 2, 3].map((star) => (
        <Ionicons
          key={star}
          name="star"
          size={16}
          color={star <= count ? '#FFD700' : '#E0E0E0'}
        />
      ))}
    </View>
  );

  const { width: screenWidth } = useWindowDimensions();
  const cardSize = 110;
  const halfCard = cardSize / 2;

  // Helper to get coordinates
  const getCardCoordinates = (lesson: LessonCard) => {
    let x = 0;
    const y = (lesson.positionStyle.top as number) + halfCard;

    if ('left' in lesson.positionStyle) {
      const leftVal = lesson.positionStyle.left;
      if (typeof leftVal === 'string' && leftVal.includes('%')) {
        const pct = parseFloat(leftVal) / 100;
        x = (screenWidth * pct) + halfCard;
      } else {
        x = (leftVal as number) + halfCard;
      }
    } else if ('right' in lesson.positionStyle) {
      const rightVal = lesson.positionStyle.right;
      if (typeof rightVal === 'string' && rightVal.includes('%')) {
        const pct = parseFloat(rightVal) / 100;
        x = screenWidth - (screenWidth * pct) - halfCard;
      } else {
        x = screenWidth - (rightVal as number) - halfCard;
      }
    } else if (lesson.positionStyle.alignSelf === 'center') {
      x = screenWidth / 2;
    }

    return { x, y };
  };

  // Generate Path
  const generatePath = () => {
    if (lessons.length < 2) return '';
    
    let d = '';
    const coords = lessons.map(getCardCoordinates);
    const offset = 65; // Distance from center to start/end drawing (55 radius + 10 gap)

    for (let i = 0; i < coords.length - 1; i++) {
      const current = coords[i];
      const next = coords[i + 1];
      
      // Calculate direction vector
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist === 0) continue;

      const ux = dx / dist;
      const uy = dy / dist;
      
      // Start/End points offset from center
      const sx = current.x + ux * offset;
      const sy = current.y + uy * offset;
      const ex = next.x - ux * offset;
      const ey = next.y - uy * offset;
      
      // Control points for smooth curve between new start/end
      const cp1y = sy + (ey - sy) / 2;
      const cp2y = ey - (ey - sy) / 2;
      
      d += `M ${sx} ${sy} C ${sx} ${cp1y}, ${ex} ${cp2y}, ${ex} ${ey} `;
    }

    return d;
  };

  return (
    <View style={styles.container}>
      {/* Simple Light Background */}
      <View style={styles.backgroundLayer} />
      
      {/* Animated Floating Shapes */}
      <View style={styles.animatedShapesContainer}>
        <Animated.View 
          style={[
            styles.floatingShape,
            styles.circle1,
            {
              transform: [
                {
                  translateY: shape1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -30],
                  }),
                },
                {
                  translateX: shape1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
              ],
            },
          ]}
        />
        
        <Animated.View 
          style={[
            styles.floatingShape,
            styles.square1,
            {
              transform: [
                {
                  translateY: shape2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 40],
                  }),
                },
                {
                  rotate: shape2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
        
        <Animated.View 
          style={[
            styles.floatingShape,
            styles.circle2,
            {
              transform: [
                {
                  translateY: shape3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -50],
                  }),
                },
                {
                  scale: shape3Anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.1, 1],
                  }),
                },
              ],
            },
          ]}
        />
        
        <Animated.View 
          style={[
            styles.floatingShape,
            styles.square2,
            {
              transform: [
                {
                  translateY: shape4Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 35],
                  }),
                },
                {
                  translateX: shape4Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -25],
                  }),
                },
              ],
            },
          ]}
        />
        
        <Animated.View 
          style={[
            styles.floatingShape,
            styles.circle3,
            {
              transform: [
                {
                  translateY: shape5Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -45],
                  }),
                },
                {
                  rotate: shape5Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-180deg'],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
      
      {/* Decorative dots only */}
      <View style={styles.decorativeElements}>
        <View style={styles.pathDot1} />
        <View style={styles.pathDot2} />
        <View style={styles.pathDot3} />
        <View style={styles.pathDot4} />
      </View>

      {/* Fixed Header at Top */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerStarsContainer}>
          <View style={styles.starBadge}>
            <Ionicons name="star" size={28} color="#FFD700" />
            <Text style={styles.starCount}>1,240</Text>
          </View>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Level 3</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Lesson Cards in Path Layout */}
        <View style={styles.pathContainer}>
          {/* Svg Dotted Path */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path
              d={generatePath()}
              stroke="#E0E0E0" // Light gray
              strokeWidth="22" // Even bigger dots
              strokeDasharray="0.1, 40" // Circle segments with more spacing
              strokeLinecap="round"
              fill="none"
              opacity={0.8}
            />
          </Svg>

          {lessons.map((lesson) => (
            <View key={lesson.id} style={[styles.cardWrapper, lesson.positionStyle]}>


              {/* Lesson Card with enhanced design */}
              <TouchableOpacity 
                style={[
                  styles.lessonCard,
                  lesson.isActive && styles.lessonCardActive
                ]}
                onPress={() => router.push('/record-audio')}
                activeOpacity={0.8}
              >
                {/* Card inner glow for active state */}
                {lesson.isActive && <View style={styles.cardInnerGlow} />}
                
                {!lesson.isActive ? (
                  <Text style={[
                    styles.lessonNumber,
                    lesson.stars > 0 && { color: '#FF8C00' } // Orange for started lessons
                  ]}>{lesson.id}</Text>
                ) : (
                  <Animated.View 
                    style={[
                      styles.mascotInCard,
                      { transform: [{ translateY: mascotAnim }] }
                    ]}
                  >
                    <Image
                      source={require('../assets/parrot.png')}
                      style={styles.mascotImage}
                      resizeMode="contain"
                    />
                  </Animated.View>
                )}
                <StarRating count={lesson.stars} />
              </TouchableOpacity>
              
              {/* Card Title */}
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              

              
              {/* Compact Play Button - Bottom Right Corner */}
              {lesson.isActive && (
                <TouchableOpacity 
                  style={styles.playButtonContainer}
                  onPress={() => router.push('/record-audio')}
                  activeOpacity={0.7}
                >
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={20} color="#FFFFFF" style={styles.playIcon} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E8',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF5E8',
  },
  animatedShapesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  floatingShape: {
    position: 'absolute',
  },
  circle1: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD4E5',
    opacity: 0.3,
    top: 100,
    left: '10%',
  },
  square1: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#D4E4FF',
    opacity: 0.25,
    top: 200,
    right: '15%',
  },
  circle2: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE4B8',
    opacity: 0.2,
    top: 450,
    left: '60%',
  },
  square2: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#B8E6B8',
    opacity: 0.25,
    top: 600,
    left: '8%',
  },
  circle3: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8D4FF',
    opacity: 0.2,
    top: 800,
    right: '12%',
  },
  decorativeElements: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  pathDot1: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#B8E6B8',
    top: 130,
    left: '22%',
    opacity: 0.4,
  },
  pathDot2: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFD4E5',
    top: 250,
    right: '28%',
    opacity: 0.4,
  },
  pathDot3: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFE4B8',
    top: 420,
    left: '45%',
    opacity: 0.4,
  },
  pathDot4: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4E4FF',
    top: 540,
    left: '30%',
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 140,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  starCount: {
    fontFamily: 'BalsamiqSans',
    fontSize: 22,
    fontWeight: '700',
    color: '#FF8C00',
    marginLeft: 8,
  },
  levelBadge: {
    backgroundColor: '#E6F2FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  levelText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 18,
    fontWeight: '700',
    color: '#4A90E2',
  },
  pathContainer: {
    position: 'relative',
    height: 1000,
    marginTop: 20,
  },
  cardWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  lessonCard: {
    width: 110,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 6,
    borderColor: '#F8F8F8',
    overflow: 'hidden',
  },
  lessonCardActive: {
    borderColor: '#FF1493',
    borderWidth: 7,
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  cardInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFE6F0',
    opacity: 0.3,
    borderRadius: 20,
  },
  lessonNumber: {
    fontFamily: 'FredokaOne',
    fontSize: 52,
    color: '#E0E0E0',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  lessonNumberActive: {
    color: '#C0C0C0',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  lessonTitle: {
    fontFamily: 'BalsamiqSans',
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
  },
  mascotInCard: {
    width: 70,
    height: 70,
    marginBottom: 0,
  },
  mascotContainer: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 80,
    height: 80,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  playButtonContainer: {
    position: 'absolute',
    bottom: 25,
    right: -15,
  },
  playButton: {
    width: 45,
    height: 45,
    backgroundColor: '#FF1493',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  playIcon: {
    marginLeft: 3,
  },
  bottomSpacer: {
    height: 100,
  },
});

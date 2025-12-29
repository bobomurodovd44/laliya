import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileMenuItem } from '../components/ProfileMenuItem';

export default function Profile() {
  const insets = useSafeAreaInsets();
  
  // Mock user data - replace with actual user data later
  const user = {
    name: 'Laliya',
    age: 5,
    gender: 'Girl',
    level: 3,
    profilePicture: 'https://i.pinimg.com/736x/36/f7/02/36f702b674bb8061396b3853ccaf80cf.jpg',
  };

  // Animated shapes
  const shape1Anim = useRef(new Animated.Value(0)).current;
  const shape2Anim = useRef(new Animated.Value(0)).current;
  const shape3Anim = useRef(new Animated.Value(0)).current;
  const shape4Anim = useRef(new Animated.Value(0)).current;
  const shape5Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate floating shapes
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape1Anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(shape1Anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape2Anim, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(shape2Anim, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape3Anim, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(shape3Anim, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape4Anim, { toValue: 1, duration: 4500, useNativeDriver: true }),
        Animated.timing(shape4Anim, { toValue: 0, duration: 4500, useNativeDriver: true }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(shape5Anim, { toValue: 1, duration: 5500, useNativeDriver: true }),
        Animated.timing(shape5Anim, { toValue: 0, duration: 5500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <View style={styles.backgroundLayer} />

      {/* Animated Floating Shapes */}
      <View style={styles.animatedShapesContainer}>
        <Animated.View style={[styles.floatingShape, styles.circle1, {
          transform: [
            { translateY: shape1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
            { translateX: shape1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.square1, {
          transform: [
            { translateY: shape2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
            { rotate: shape2Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.circle2, {
          transform: [
            { translateY: shape3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) },
            { scale: shape3Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.square2, {
          transform: [
            { translateY: shape4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 35] }) },
            { translateX: shape4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) }
          ]
        }]} />
        <Animated.View style={[styles.floatingShape, styles.circle3, {
          transform: [
            { translateY: shape5Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -45] }) },
            { rotate: shape5Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-180deg'] }) }
          ]
        }]} />
      </View>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 12 }]}>
        <View style={{ width: 32 }} /> {/* Placeholder for balance */}
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => {}}>
          <Ionicons name="settings-sharp" size={24} color="#4B4B4B" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info Section - Simplified */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: user.profilePicture }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editIconButton} onPress={() => {}}>
              <Ionicons name="pencil" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.childName}>
            {user.name}
          </Text>
          <Text style={styles.subtitleText}>{user.age} years old • {user.gender}</Text>
        </View>

        {/* Stats Row - Duolingo Style Widgets */}
        <View style={styles.statsRow}>
          {/* Stars Card */}
          <View style={[styles.statCard, { borderColor: '#FFD700' }]}>
            <Text style={styles.statTitle}>Stars</Text>
            <View style={styles.statValueContainer}>
              <Ionicons name="star" size={24} color="#FFD700" style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>1,240</Text>
            </View>
          </View>

          {/* Level Card */}
          <View style={[styles.statCard, { borderColor: '#4DA6FF' }]}>
            <Text style={styles.statTitle}>Level</Text>
            <View style={styles.statValueContainer}>
              <Ionicons name="trophy" size={24} color="#4DA6FF" style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{user.level}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Account Actions */}
        <View style={styles.section}>
          <ProfileMenuItem 
            iconName="share-social-outline"
            title="Share Profile"
            onPress={() => {}}
          />
          <ProfileMenuItem 
            iconName="log-out-outline"
            title="Logout"
            onPress={() => {}}
          />
          <ProfileMenuItem 
            iconName="trash-outline"
            title="Delete Account"
            variant="danger"
            onPress={() => {}}
          />
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
    backgroundColor: '#FFD7E5',
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
    top: 500,
    right: '12%',
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
    borderBottomWidth: 2,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontFamily: 'FredokaOne',
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
  },
  settingsButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
  },
  editIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4DA6FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  childName: {
    fontFamily: 'FredokaOne',
    fontSize: 32,
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#E5E5E5', // Default fallback
    alignItems: 'flex-start',
  },
  statTitle: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: '#777',
    marginBottom: 8,
    fontWeight: '700',
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontFamily: 'FredokaOne',
    fontSize: 24,
    color: '#333',
  },
  divider: {
    height: 2,
    backgroundColor: '#E5E5E5',
    marginBottom: 20,
    borderRadius: 1,
  },
  section: {
    gap: 10,
  },
  bottomSpacer: {
    height: 50,
  },
});

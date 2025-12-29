import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DuoButton } from '../components/DuoButton';
import { Input } from '../components/Input';

export default function AddChild() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl' | null>(null);

  // Animated shapes (Consistent with other pages)
  const shape1Anim = useRef(new Animated.Value(0)).current;
  const shape2Anim = useRef(new Animated.Value(0)).current;
  const shape3Anim = useRef(new Animated.Value(0)).current;
  const shape4Anim = useRef(new Animated.Value(0)).current;
  const shape5Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate floating shapes
    const animateShape = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: duration, useNativeDriver: true }),
        ])
      ).start();
    };

    animateShape(shape1Anim, 4000);
    animateShape(shape2Anim, 5000);
    animateShape(shape3Anim, 6000);
    animateShape(shape4Anim, 4500);
    animateShape(shape5Anim, 5500);
  }, []);

  const handleAddChild = () => {
    // Implement add child logic here
    router.back(); // Navigate back to profile on success (mock)
  };

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

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 150 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formContainer, { marginTop: insets.top + 40 }]}>
            <Text style={styles.title}>Add Child</Text>
            <Text style={styles.subtitle}>Who's learning today?</Text>

            <View style={styles.inputGroup}>
              <Input
                icon="person-add"
                placeholder="Child's Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Input
                icon="calendar-number"
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                maxLength={2}
              />
              
              {/* Gender Selection */}
              <View style={styles.genderContainer}>
                 <Text style={styles.label}>Select Gender</Text>
                 <View style={styles.genderOptions}>
                   <TouchableOpacity 
                    style={[
                      styles.genderCard, 
                      gender === 'boy' && styles.genderCardActive,
                      { borderColor: '#4DA6FF' } // Blue for boy
                    ]}
                    onPress={() => setGender('boy')}
                    activeOpacity={0.8}
                   >
                     <View style={[
                       styles.genderIconContainer, 
                       { backgroundColor: gender === 'boy' ? '#4DA6FF' : '#E6F2FF' }
                     ]}>
                       <Ionicons name="man" size={32} color={gender === 'boy' ? '#FFF' : '#4DA6FF'} />
                     </View>
                     <Text style={[styles.genderText, gender === 'boy' && styles.genderTextActive]}>
                       Boy
                     </Text>
                     {gender === 'boy' && (
                       <View style={styles.checkmarkBadge}>
                         <Ionicons name="checkmark" size={18} color="#FFF" />
                       </View>
                     )}
                   </TouchableOpacity>

                   <TouchableOpacity 
                    style={[
                      styles.genderCard, 
                      gender === 'girl' && styles.genderCardActive,
                      { borderColor: '#FF69B4' } // Pink for girl
                    ]}
                    onPress={() => setGender('girl')}
                    activeOpacity={0.8}
                   >
                     <View style={[
                       styles.genderIconContainer,
                       { backgroundColor: gender === 'girl' ? '#FF69B4' : '#FFE6F0' }
                     ]}>
                       <Ionicons name="woman" size={32} color={gender === 'girl' ? '#FFF' : '#FF69B4'} />
                     </View>
                     <Text style={[styles.genderText, gender === 'girl' && styles.genderTextActive]}>
                       Girl
                     </Text>
                     {gender === 'girl' && (
                       <View style={styles.checkmarkBadge}>
                         <Ionicons name="checkmark" size={18} color="#FFF" />
                       </View>
                     )}
                   </TouchableOpacity>
                 </View>
              </View>

            </View>

            <View style={styles.buttonContainer}>
              <DuoButton 
                title="ADD PROFILE" 
                onPress={handleAddChild}
                color="orange"
                size="large"
              />
            </View>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  // Reused shape styles
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
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontFamily: 'FredokaOne',
    fontSize: 28,
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'BalsamiqSans',
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  inputGroup: {
    width: '100%',
    gap: 16,
    marginBottom: 30,
  },
  label: {
    fontFamily: 'BalsamiqSans',
    fontSize: 18,
    color: '#555',
    marginBottom: 12,
    marginLeft: 4,
  },
  genderContainer: {
    width: '100%',
    marginTop: 10,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  genderCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderBottomWidth: 6, // 3D effect
    borderColor: '#EFEFEF', // default
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  genderCardActive: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.02 }],
  },
  genderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  genderText: {
    fontFamily: 'FredokaOne',
    fontSize: 18,
    color: '#999',
  },
  genderTextActive: {
    color: '#333',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#58CC02',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  }
});

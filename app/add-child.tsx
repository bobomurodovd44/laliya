import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../components/BackButton';
import { DuoButton } from '../components/DuoButton';
import { Input } from '../components/Input';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Body, Title, Subtitle } from '../components/Typography';
import { Colors, Spacing, Typography } from '../constants';
import app from '../lib/feathers/feathers-client';
import { useAuthStore } from '../lib/store/auth-store';

export default function AddChild() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setAuthenticated } = useAuthStore();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prevent users who already have childMeta from accessing this page
  useEffect(() => {
    if (user) {
      const hasChildMeta = user.childMeta && 
        user.childMeta.fullName && 
        user.childMeta.age && 
        user.childMeta.gender;
      
      if (hasChildMeta) {
        // User already has childMeta, redirect to home
        router.replace('/');
      }
    }
  }, [user, router]);

  const handleAddChild = async () => {
    // Validate inputs
    if (!name.trim()) {
      setError('Please enter the child\'s name');
      return;
    }
    
    if (!age.trim()) {
      setError('Please enter the child\'s age');
      return;
    }
    
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 18) {
      setError('Please enter a valid age (1-18)');
      return;
    }
    
    if (!gender) {
      setError('Please select a gender');
      return;
    }
    
    if (!user?._id) {
      setError('User not found. Please log in again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Map gender from 'boy'/'girl' to 'male'/'female'
      const backendGender = gender === 'boy' ? 'male' : 'female';
      
      // Save childMeta to backend
      const updatedUser = await app.service('users').patch(user._id, {
        childMeta: {
          fullName: name.trim(),
          age: ageNum,
          gender: backendGender,
        },
      });

      // Update auth store with the new user data
      setAuthenticated(updatedUser);

      // Redirect to index page
      router.replace('/');
    } catch (err: any) {
      console.error('Error saving child meta:', err);
      setError(err.message || 'Failed to save child information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer useFloatingShapes>
      <PageHeader />
      
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
            <Title size="large">Add Child</Title>
            <Subtitle style={styles.subtitle}>Who's learning today?</Subtitle>

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
              
              <View style={styles.genderContainer}>
                <Body style={styles.label} weight="bold">Select Gender</Body>
                <View style={styles.genderOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.genderCard, 
                      gender === 'boy' && styles.genderCardActive,
                      { borderColor: Colors.info }
                    ]}
                    onPress={() => setGender('boy')}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.genderIconContainer, 
                      { backgroundColor: gender === 'boy' ? Colors.info : Colors.infoLight }
                    ]}>
                      <Ionicons name="man" size={32} color={gender === 'boy' ? Colors.textWhite : Colors.info} />
                    </View>
                    <Body style={[styles.genderText, gender === 'boy' && styles.genderTextActive]}>
                      Boy
                    </Body>
                    {gender === 'boy' && (
                      <View style={styles.checkmarkBadge}>
                        <Ionicons name="checkmark" size={18} color={Colors.textWhite} />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.genderCard, 
                      gender === 'girl' && styles.genderCardActive,
                      { borderColor: '#FF69B4' }
                    ]}
                    onPress={() => setGender('girl')}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.genderIconContainer,
                      { backgroundColor: gender === 'girl' ? '#FF69B4' : '#FFE6F0' }
                    ]}>
                      <Ionicons name="woman" size={32} color={gender === 'girl' ? Colors.textWhite : '#FF69B4'} />
                    </View>
                    <Body style={[styles.genderText, gender === 'girl' && styles.genderTextActive]}>
                      Girl
                    </Body>
                    {gender === 'girl' && (
                      <View style={styles.checkmarkBadge}>
                        <Ionicons name="checkmark" size={18} color={Colors.textWhite} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Body style={styles.errorText}>{error}</Body>
              </View>
            ) : null}

            <View style={styles.buttonContainer}>
              <DuoButton 
                title={loading ? "SAVING..." : "ADD PROFILE"} 
                onPress={handleAddChild}
                color="orange"
                size="large"
                disabled={loading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.padding.xxl,
  },
  formContainer: {
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    marginBottom: Spacing.margin.xxxxl,
  },
  inputGroup: {
    width: '100%',
    gap: Spacing.gap.lg,
    marginBottom: Spacing.margin.xxxl,
  },
  label: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.margin.md,
    marginLeft: Spacing.margin.xs,
  },
  genderContainer: {
    width: '100%',
    marginTop: Spacing.margin.md,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: Spacing.gap.xl,
    justifyContent: 'center',
  },
  genderCard: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: Spacing.radius.xl,
    padding: Spacing.padding.lg,
    alignItems: 'center',
    borderWidth: Spacing.borderWidth.thick,
    borderBottomWidth: Spacing.borderWidth.xxxthick,
    ...Spacing.shadow.medium,
    position: 'relative',
  },
  genderCardActive: {
    backgroundColor: Colors.backgroundLight,
    transform: [{ scale: 1.02 }],
  },
  genderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.margin.md,
  },
  genderText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.lg,
    color: Colors.textTertiary,
  },
  genderTextActive: {
    color: Colors.textPrimary,
  },
  checkmarkBadge: {
    position: 'absolute',
    top: Spacing.margin.md,
    right: Spacing.margin.md,
    backgroundColor: Colors.success,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: Spacing.borderWidth.medium,
    borderColor: Colors.backgroundLight,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: Spacing.margin.xxxxl,
  },
  errorContainer: {
    width: '100%',
    marginBottom: Spacing.margin.lg,
    padding: Spacing.padding.md,
    backgroundColor: Colors.errorLight,
    borderRadius: Spacing.radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    textAlign: 'center',
  },
});

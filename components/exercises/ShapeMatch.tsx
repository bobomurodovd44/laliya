import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Exercise } from '../../data/data';

interface ShapeMatchProps {
  exercise: Exercise;
  onComplete: () => void;
}

export default function ShapeMatch({ exercise, onComplete }: ShapeMatchProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shape Match</Text>
      <Text style={styles.question}>{exercise.question}</Text>
      
      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Match the shapes to the pictures!
        </Text>
        
        <TouchableOpacity 
          style={styles.testButton}
          onPress={onComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.testButtonText}>Complete Exercise (Test)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontFamily: 'FredokaOne',
    fontSize: 28,
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 16,
  },
  question: {
    fontFamily: 'BalsamiqSans',
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  placeholder: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  testButtonText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Exercise } from '../../data/data';

interface ShapeMatchProps {
  exercise: Exercise;
}

export default function ShapeMatch({ exercise }: ShapeMatchProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shape Match</Text>
      <Text style={styles.question}>{exercise.question}</Text>
      
      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Match the shapes to the pictures!
        </Text>
        {/* TODO: Add drag and drop matching interface */}
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
  },
  placeholder: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

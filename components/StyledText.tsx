import { StyleSheet, Text, TextProps } from 'react-native';

interface StyledTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body';
}

export function StyledText({ variant = 'body', style, ...props }: StyledTextProps) {
  return <Text style={[styles[variant], style]} {...props} />;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'FredokaOne',
    fontSize: 32, // Increased size
    color: '#333',
  },
  subtitle: {
    fontFamily: 'PatrickHand',
    fontSize: 24, // Increased size
    color: '#555',
  },
  body: {
    fontFamily: 'PatrickHand',
    fontSize: 20, // Increased size
    color: '#333',
  },
});

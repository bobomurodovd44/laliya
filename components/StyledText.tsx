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
    fontSize: 36, // Increased size
    color: '#333',
  },
  subtitle: {
    fontFamily: 'BalsamiqSans',
    fontSize: 28, // Increased size
    color: '#555',
  },
  body: {
    fontFamily: 'BalsamiqSans',
    fontSize: 24, // Increased size
    color: '#333',
  },
});

import { StyleSheet, View } from 'react-native';
import { StyledText } from '../components/StyledText';

export default function Task() {
  return (
    <View style={styles.container}>
      <StyledText variant="title" style={styles.title}>Task</StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 20,
  },
});

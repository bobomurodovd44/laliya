import { StyleSheet, View } from 'react-native';
import { DuoButton } from '../components/DuoButton';
import { StyledText } from '../components/StyledText';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <StyledText variant="title" style={styles.title}>Welcome to Laliya!</StyledText>
      <StyledText variant="subtitle" style={styles.subtitle}>Check out our 3D buttons!</StyledText>
      
      <View style={styles.buttonContainer}>
        <DuoButton 
          title="Get Started" 
          color="green" 
          size="large"
          onPress={() => console.log('Get Started pressed')}
          style={styles.button}
        />
        
        <DuoButton 
          title="Learn More" 
          color="blue" 
          size="medium"
          onPress={() => console.log('Learn More pressed')}
          style={styles.button}
        />
        
        <DuoButton 
          title="Try It" 
          color="purple" 
          size="small"
          onPress={() => console.log('Try It pressed')}
          style={styles.button}
        />
        
        <View style={styles.row}>
          <DuoButton 
            title="Yes" 
            color="yellow" 
            size="small"
            onPress={() => console.log('Yes pressed')}
            style={styles.smallButton}
          />
          
          <DuoButton 
            title="No" 
            color="red" 
            size="small"
            onPress={() => console.log('No pressed')}
            style={styles.smallButton}
          />
        </View>
      </View>
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
    marginBottom: 10,
  },
  subtitle: {
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  smallButton: {
    marginHorizontal: 8,
  },
});

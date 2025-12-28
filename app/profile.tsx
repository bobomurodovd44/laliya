import { Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProfileMenuItem } from '../components/ProfileMenuItem';
import { StyledText } from '../components/StyledText';

export default function Profile() {
  // Mock user data - replace with actual user data later
  const user = {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    profilePicture: 'https://via.placeholder.com/120/58CC02/FFFFFF?text=SJ',
  };

  return (
    <ImageBackground 
      source={require('../assets/background.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      {/* Semi-transparent overlay */}
      <View style={styles.overlay} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: user.profilePicture }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editIconButton} onPress={() => {}}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
          
          <StyledText variant="title" style={styles.name}>
            {user.name}
          </StyledText>
          
          <StyledText 
            variant="body" 
            style={styles.email}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user.email}
          </StyledText>
        </View>

        {/* Account Settings Section */}
        <View style={styles.section}>
          <StyledText variant="subtitle" style={styles.sectionTitle}>
            ⚙️ Account Settings
          </StyledText>
          
          <ProfileMenuItem 
            icon="🗑️"
            title="Delete Account"
            variant="danger"
            onPress={() => {}}
          />
          
          <ProfileMenuItem 
            icon="🚪"
            title="Logout"
            onPress={() => {}}
          />
        </View>

        {/* More Section */}
        <View style={styles.section}>
          <StyledText variant="subtitle" style={styles.sectionTitle}>
            ✨ More
          </StyledText>
          
          <ProfileMenuItem 
            icon="📤"
            title="Share the App"
            onPress={() => {}}
          />
          
          <ProfileMenuItem 
            icon="⭐"
            title="Rate Us"
            onPress={() => {}}
          />
          
          <ProfileMenuItem 
            icon="📜"
            title="Terms of Use"
            onPress={() => {}}
          />
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  editIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#58CC02',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editIcon: {
    fontSize: 20,
  },
  name: {
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  email: {
    textAlign: 'center',
    color: '#555',
    maxWidth: '90%',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#333',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomSpacer: {
    height: 20,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image, ImageBackground, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ProfileMenuItem } from '../components/ProfileMenuItem';
import { StyledText } from '../components/StyledText';

export default function Profile() {
  // Mock user data - replace with actual user data later
  const user = {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    profilePicture: 'https://i.pinimg.com/736x/36/f7/02/36f702b674bb8061396b3853ccaf80cf.jpg',
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
              <Ionicons name="pencil" size={24} color="#FFFFFF" />
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
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={32} color="#007AFF" />
            <StyledText variant="subtitle" style={styles.sectionTitle}>
              Account Settings
            </StyledText>
          </View>
          
          <ProfileMenuItem 
            iconName="trash-outline"
            title="Delete Account"
            variant="danger"
            onPress={() => {}}
          />
          
          <ProfileMenuItem 
            iconName="log-out-outline"
            title="Logout"
            onPress={() => {}}
          />
        </View>

        {/* More Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps" size={32} color="#8E44AD" />
            <StyledText variant="subtitle" style={styles.sectionTitle}>
              More
            </StyledText>
          </View>
          
          <ProfileMenuItem 
            iconName="share-social-outline"
            title="Share the App"
            onPress={() => {}}
          />
          
          <ProfileMenuItem 
            iconName="star-outline"
            title="Rate Us"
            onPress={() => {}}
          />
          
          <ProfileMenuItem 
            iconName="document-text-outline"
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
    paddingTop: 120, // Adjusted for transparent header
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    color: '#333',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomSpacer: {
    height: 20,
  },
});

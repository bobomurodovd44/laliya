import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProfileMenuItem } from '../components/ProfileMenuItem';
import { StyledText } from '../components/StyledText';

export default function Profile() {
  // Mock user data - replace with actual user data later
  const user = {
    name: 'Laliya',
    age: 5,
    gender: 'Girl',
    level: 3,
    profilePicture: 'https://i.pinimg.com/736x/36/f7/02/36f702b674bb8061396b3853ccaf80cf.jpg',
  };

  return (
    <View style={styles.container}>
      {/* Background Layer */}
      <View style={styles.backgroundLayer} />
      
      {/* Custom Title Header */}
      <View style={styles.headerContainer}>
        <StyledText variant="title" style={styles.headerTitle}>My Profile</StyledText>
      </View>

      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Section */}
        {/* 3D Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: user.profilePicture }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editIconButton} onPress={() => {}}>
              <Ionicons name="pencil-sharp" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.childName}>
            {user.name}
          </Text>
          
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleText}>{user.age} years old</Text>
            <View style={styles.subtitleDot} />
            <Text style={styles.subtitleText}>{user.gender}</Text>
          </View>
        </View>

        {/* Stats Row (Two 3D Cards) */}
        <View style={styles.statsRow}>
          {/* Stars Card */}
          <View style={[styles.statCard, { backgroundColor: '#FFFDE7' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF9C4' }]}>
              <Ionicons name="star" size={32} color="#FFD700" />
            </View>
            <View style={{ flex: 1, alignItems: 'center', marginTop: 12 }}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>1,240</Text>
              <Text style={styles.statTitle}>Stars</Text>
            </View>
          </View>

          {/* Level Card */}
          <View style={[styles.statCard, { backgroundColor: '#F0F4FF' }]}>
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="trophy" size={32} color="#4DA6FF" />
            </View>
            <View style={{ flex: 1, alignItems: 'center', marginTop: 12 }}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{user.level}</Text>
              <Text style={styles.statTitle}>Level</Text>
            </View>
          </View>
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



        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    color: '#333',
    textAlign: 'left',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 140, // Space for floating tab bar
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
    // 3D Shadow Effect
    shadowColor: '#E0C0A0', // Warm shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderBottomWidth: 6,
    borderRightWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: '#FFF5E8', // Matches background
  },
  editIconButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FF1493', // Index accent color
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  childName: {
    fontFamily: 'FredokaOne',
    fontSize: 34,
    color: '#1A1A1A', // Dark Black
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  subtitleText: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: '#AAAAAA', // Light Gray
  },
  subtitleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 16, // Consistent gap between cards
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // 3D Shadow
    shadowColor: '#E0C0A0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderBottomWidth: 5,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'FredokaOne',
    fontSize: 28,
    color: '#333',
    lineHeight: 32,
  },
  statTitle: {
    fontFamily: 'BalsamiqSans',
    fontSize: 16,
    color: '#888',
    marginTop: 2,
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

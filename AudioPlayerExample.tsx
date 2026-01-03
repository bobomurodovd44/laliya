import { Audio, AVPlaybackStatus } from "expo-av";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Platform, StyleSheet, Text, View } from "react-native";

interface AudioPlayerProps {
  audioSource: any; // require() result or { uri: string }
}

export default function AudioPlayerExample({ audioSource }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isUnmountingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      if (sound) {
        sound.setOnPlaybackStatusUpdate(null);
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  // Setup playback status listener
  const setupPlaybackStatusListener = useCallback((audioSound: Audio.Sound) => {
    audioSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      // Don't process updates if component is unmounting
      if (isUnmountingRef.current) return;

      if (status.isLoaded) {
        // Update playing state
        setIsPlaying(status.isPlaying);

        // Handle audio finish
        if (status.didJustFinish) {
          setIsPlaying(false);

          // Reset position and unload audio
          audioSound.setPositionAsync(0).catch(() => {});
          audioSound
            .unloadAsync()
            .then(() => {
              if (!isUnmountingRef.current) {
                setSound(null);
              }
            })
            .catch(() => {});
        }
      } else {
        setIsPlaying(false);
      }
    });
  }, []);

  // Request audio permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return true;

    try {
      const { status } = await Audio.getPermissionsAsync();
      if (status === "granted") return true;

      const { status: newStatus } = await Audio.requestPermissionsAsync();
      return newStatus === "granted";
    } catch {
      return false;
    }
  }, []);

  // Play audio
  const playAudio = useCallback(async () => {
    try {
      setIsLoading(true);

      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Audio playback requires permission"
        );
        setIsLoading(false);
        return;
      }

      // If sound exists and is playing, pause it
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
            setIsLoading(false);
            return;
          }
        } catch {
          // Continue to create new sound
        }
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      }).catch(() => {});

      // Unload existing sound if any
      if (sound) {
        sound.setOnPlaybackStatusUpdate(null);
        await sound.unloadAsync().catch(() => {});
      }

      // Create and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(audioSource, {
        shouldPlay: true,
      });

      setSound(newSound);
      setIsPlaying(true);
      setupPlaybackStatusListener(newSound);
    } catch (error) {
      console.error("Error playing audio:", error);
      Alert.alert(
        "Error",
        `Failed to play audio: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsPlaying(false);
      setSound(null);
    } finally {
      setIsLoading(false);
    }
  }, [sound, requestPermissions, setupPlaybackStatusListener, audioSource]);

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (sound) {
      try {
        sound.setOnPlaybackStatusUpdate(null);
        await sound.unloadAsync();
      } catch (error) {
        console.error("Error cleaning up audio:", error);
      }
      setSound(null);
      setIsPlaying(false);
    }
  }, [sound]);

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        Status: {isLoading ? "Loading..." : isPlaying ? "Playing" : "Stopped"}
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title={isPlaying ? "Pause" : "Play"}
          onPress={playAudio}
          disabled={isLoading}
        />
        <View style={styles.spacer} />
        <Button title="Stop & Unload" onPress={cleanup} disabled={!sound} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  statusText: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  spacer: {
    width: 20,
  },
});

// Usage example:
// <AudioPlayerExample audioSource={require('./assets/audio.mp3')} />
// or
// <AudioPlayerExample audioSource={{ uri: 'https://example.com/audio.mp3' }} />

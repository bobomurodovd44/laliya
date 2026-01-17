import { Audio } from 'expo-av';

const sounds = {
    correct: require('../assets/correct.mp3'),
    wrong: require('../assets/wrong.mp3'),
};

export async function playSound(type: 'correct' | 'wrong') {
    try {
        const { sound } = await Audio.Sound.createAsync(
            sounds[type],
            { shouldPlay: true }
        );

        // Auto-unload sound when finished
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync().catch(() => { });
            }
        });

        await sound.playAsync();
    } catch (error) {
        console.error(`Failed to play ${type} sound:`, error);
    }
}

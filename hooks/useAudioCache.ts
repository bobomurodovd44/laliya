import { Audio, AVPlaybackStatus } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";
import { audioCache } from "../lib/audio-cache";

export const useAudioCache = (url?: string) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const isUnmountingRef = useRef(false);

    useEffect(() => {
        isUnmountingRef.current = false;
        return () => {
            isUnmountingRef.current = true;
            if (sound) {
                sound.unloadAsync().catch(() => { });
            }
        };
    }, [sound]);

    const play = useCallback(async (customUrl?: string) => {
        const targetUrl = customUrl || url;
        if (!targetUrl || isPlaying) return;

        try {
            // 1. Get local URI (instantly if cached)
            const localUri = await audioCache.getLocalUri(targetUrl);

            // 2. Clear old sound if exists
            if (sound) {
                await sound.unloadAsync().catch(() => { });
                setSound(null);
            }

            // 3. Create and play
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: localUri },
                { shouldPlay: true }
            );

            setSound(newSound);
            setIsPlaying(true);

            newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
                if (isUnmountingRef.current) return;
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } catch (error) {
            console.warn("Failed to play cached audio:", targetUrl, error);
            setIsPlaying(false);
        }
    }, [url, isPlaying, sound]);

    const stop = useCallback(async () => {
        if (sound) {
            await sound.stopAsync().catch(() => { });
            setIsPlaying(false);
        }
    }, [sound]);

    return { play, stop, isPlaying };
};

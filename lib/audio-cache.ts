import * as FileSystem from "expo-file-system/legacy";

const CACHE_FOLDER = `${(FileSystem as any).cacheDirectory}audio_cache/`;

class AudioCache {
    private initPromise: Promise<void> | null = null;

    constructor() {
        this.initPromise = this.ensureDir();
    }

    private async ensureDir() {
        const dirInfo = await FileSystem.getInfoAsync(CACHE_FOLDER);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(CACHE_FOLDER, { intermediates: true });
        }
    }

    /**
     * Generates a local filename from a URL
     */
    private getLocalFileName(url: string): string {
        // Basic filename extraction or hashing
        const filename = url.substring(url.lastIndexOf("/") + 1).split("?")[0];
        // Add hash of full URL to avoid collisions for same filename in different paths
        const hash = this.stringHash(url);
        return `${hash}_${filename}`;
    }

    private stringHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Preloads an audio file to local storage
     */
    async preload(url: string): Promise<string> {
        if (!url || typeof url !== 'string') return url;
        if (url.startsWith('file://')) return url;

        await this.initPromise;

        const localUri = `${CACHE_FOLDER}${this.getLocalFileName(url)}`;
        const fileInfo = await FileSystem.getInfoAsync(localUri);

        if (fileInfo.exists) {
            return localUri;
        }

        try {
            const { uri } = await FileSystem.downloadAsync(url, localUri);
            return uri;
        } catch (error) {
            console.warn("Failed to download audio:", url, error);
            return url; // Fallback to remote URL
        }
    }

    /**
     * Preloads a batch of URLs
     */
    async preloadBatch(urls: string[], priority: "high" | "normal" = "normal") {
        const uniqueUrls = Array.from(new Set(urls.filter(u => u && typeof u === 'string')));

        if (priority === "high") {
            // Load sequentially for high priority to ensure immediate availability
            for (const url of uniqueUrls) {
                await this.preload(url);
            }
        } else {
            // Parallel download for background
            await Promise.allSettled(uniqueUrls.map(url => this.preload(url)));
        }
    }

    /**
     * Gets the local URI for a remote URL if cached, otherwise returns original
     */
    async getLocalUri(url: string): Promise<string> {
        if (!url || typeof url !== 'string') return url;
        if (url.startsWith('file://')) return url;

        const localUri = `${CACHE_FOLDER}${this.getLocalFileName(url)}`;
        const fileInfo = await FileSystem.getInfoAsync(localUri);

        return fileInfo.exists ? localUri : url;
    }

    /**
     * Clear the cache folder
     */
    async clearCache() {
        try {
            await FileSystem.deleteAsync(CACHE_FOLDER, { idempotent: true });
            await this.ensureDir();
        } catch (error) {
            console.error("Failed to clear audio cache:", error);
        }
    }
}

export const audioCache = new AudioCache();

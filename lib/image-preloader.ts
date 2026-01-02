import { Image } from "expo-image";

type Priority = "high" | "normal" | "low";

interface PreloadTask {
  url: string;
  priority: Priority;
  resolve: () => void;
  reject: (error: Error) => void;
}

/**
 * Centralized image preloading service with priority queue and batch loading
 */
class ImagePreloader {
  private preloadedUrls = new Set<string>();
  private preloadingUrls = new Set<string>();
  private priorityQueue: PreloadTask[] = [];
  private isProcessing = false;
  private maxConcurrent = 6; // Limit concurrent downloads

  /**
   * Check if an image URL is already preloaded
   */
  isPreloaded(url: string): boolean {
    return this.preloadedUrls.has(url);
  }

  /**
   * Check if an image URL is currently being preloaded
   */
  isPreloading(url: string): boolean {
    return this.preloadingUrls.has(url);
  }

  /**
   * Preload a single image with priority
   */
  async preload(url: string, priority: Priority = "normal"): Promise<void> {
    // Skip if already preloaded
    if (this.preloadedUrls.has(url)) {
      return;
    }

    // Skip if already preloading
    if (this.preloadingUrls.has(url)) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      // Add to priority queue
      this.priorityQueue.push({ url, priority, resolve, reject });
      
      // Sort queue by priority (high -> normal -> low)
      this.priorityQueue.sort((a, b) => {
        const priorityOrder: Record<Priority, number> = {
          high: 0,
          normal: 1,
          low: 2,
        };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Start processing if not already
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Preload multiple images in batch with priority
   */
  async preloadBatch(
    urls: string[],
    priority: Priority = "normal"
  ): Promise<void> {
    // Filter out already preloaded URLs
    const urlsToPreload = urls.filter(
      (url) => !this.preloadedUrls.has(url) && !this.preloadingUrls.has(url)
    );

    if (urlsToPreload.length === 0) {
      return;
    }

    // Preload all in parallel (they'll be queued by priority)
    await Promise.all(
      urlsToPreload.map((url) => this.preload(url, priority))
    );
  }

  /**
   * Preload all images for a stage
   */
  async preloadStage(stageId: string): Promise<void> {
    try {
      // Import here to avoid circular dependencies
      const { fetchExercisesByStageId } = await import("./api/exercises");
      const apiExercises = await fetchExercisesByStageId(stageId);

      const imageUrls: string[] = [];

      // Extract all image URLs from all exercises
      apiExercises.forEach((apiExercise) => {
        // Add option images
        apiExercise.options?.forEach((option) => {
          if (option.img?.name) {
            imageUrls.push(option.img.name);
          }
        });

        // Add answer image if exists
        if (apiExercise.answer?.img?.name) {
          imageUrls.push(apiExercise.answer.img.name);
        }
      });

      // Remove duplicates
      const uniqueUrls = Array.from(new Set(imageUrls));

      // Preload with normal priority (background loading)
      await this.preloadBatch(uniqueUrls, "normal");
    } catch (error) {
      // Don't throw - preloading failures shouldn't block the app
    }
  }

  /**
   * Process the priority queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.priorityQueue.length > 0) {
      // Get batch of tasks up to maxConcurrent
      const batch: PreloadTask[] = [];
      const activeUrls = new Set<string>();

      // Fill batch with high priority first, then normal, then low
      while (batch.length < this.maxConcurrent && this.priorityQueue.length > 0) {
        const task = this.priorityQueue.shift();
        if (task && !activeUrls.has(task.url)) {
          batch.push(task);
          activeUrls.add(task.url);
        }
      }

      if (batch.length === 0) {
        break;
      }

      // Mark URLs as preloading
      batch.forEach((task) => {
        this.preloadingUrls.add(task.url);
      });

      // Preload batch in parallel
      const preloadPromises = batch.map(async (task) => {
        try {
          await Image.prefetch(task.url);
          this.preloadedUrls.add(task.url);
          this.preloadingUrls.delete(task.url);
          task.resolve();
        } catch (error) {
          this.preloadingUrls.delete(task.url);
          task.reject(
            error instanceof Error
              ? error
              : new Error(`Failed to preload ${task.url}`)
          );
        }
      });

      // Wait for batch to complete
      await Promise.allSettled(preloadPromises);
    }

    this.isProcessing = false;
  }

  /**
   * Clear preload cache (useful for memory management)
   */
  clearCache(): void {
    this.preloadedUrls.clear();
    this.preloadingUrls.clear();
    this.priorityQueue = [];
  }

  /**
   * Get statistics about preloading
   */
  getStats() {
    return {
      preloaded: this.preloadedUrls.size,
      preloading: this.preloadingUrls.size,
      queued: this.priorityQueue.length,
    };
  }
}

// Export singleton instance
export const imagePreloader = new ImagePreloader();


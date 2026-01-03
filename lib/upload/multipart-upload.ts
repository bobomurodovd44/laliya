import * as FileSystem from "expo-file-system/legacy";
import app from "../feathers/feathers-client";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

/**
 * Generates audio file name in format: timestamp_userId_exerciseId.extension
 */
export const generateAudioFileName = (
  userId: string,
  exerciseId: string,
  extension: string = "m4a"
): string => {
  const timestamp = Date.now();
  return `${timestamp}_${userId}_${exerciseId}.${extension}`;
};

/**
 * Gets file extension from URI
 */
const getFileExtension = (uri: string): string => {
  const match = uri.match(/\.([^.]+)$/);
  return match ? match[1] : "m4a";
};

/**
 * Gets content type based on file extension
 */
const getContentType = (extension: string): string => {
  const contentTypeMap: Record<string, string> = {
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    aac: "audio/aac",
    ogg: "audio/ogg",
  };
  return contentTypeMap[extension.toLowerCase()] || "audio/mp4";
};

/**
 * Uploads audio file using multipart upload to Media service
 * @param fileUri - Local file URI (from expo-av recording)
 * @param userId - User ID
 * @param exerciseId - Exercise ID
 * @param setUploadProgress - Optional progress callback
 * @returns Promise<string | null> - Media ID if successful, null otherwise
 */
export const uploadAudioMultipart = async (
  fileUri: string,
  userId: string,
  exerciseId: string,
  setUploadProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      console.error("File does not exist:", fileUri);
      return null;
    }

    const fileSize = fileInfo.size || 0;
    if (fileSize === 0) {
      console.error("File is empty:", fileUri);
      return null;
    }

    // Generate file name
    const extension = getFileExtension(fileUri);
    const fileName = generateAudioFileName(userId, exerciseId, extension);
    const contentType = getContentType(extension);

    // Initialize multipart upload
    const initResponse = await app.service("uploads").create({
      key: fileName,
      contentType: contentType,
    });

    const { uploadId, key } = initResponse as {
      uploadId: string;
      key: string;
    };

    if (!uploadId || !key) {
      console.error("Failed to initialize upload:", initResponse);
      return null;
    }

    // Read entire file as base64 (for audio recordings, this is acceptable as they're typically small)
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // In React Native, we can't use Buffer
    // We'll send base64 string with data: prefix so backend can recognize and decode it
    // Backend will handle the base64 decoding and chunking if needed
    // For simplicity, we'll send the entire file as one chunk (audio files are typically small)
    // If file is larger than CHUNK_SIZE, we need to chunk the base64 string
    // Base64 encoding: 3 bytes = 4 characters, so we need to chunk base64 string properly

    // Calculate approximate number of chunks based on original file size
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const parts: Array<{ ETag: string; PartNumber: number }> = [];

    // For base64 chunking, we need to ensure we don't break in the middle of a 4-character group
    // Each base64 group represents 3 bytes, so we'll chunk in multiples of 4 characters
    // Approximate: CHUNK_SIZE bytes ≈ (CHUNK_SIZE * 4/3) base64 characters
    const base64ChunkSize = Math.ceil((CHUNK_SIZE * 4) / 3);
    // Round to nearest multiple of 4 to avoid breaking base64 groups
    const alignedChunkSize = Math.ceil(base64ChunkSize / 4) * 4;

    // Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * alignedChunkSize;
      const end = Math.min(fileContent.length, start + alignedChunkSize);

      // Slice base64 string chunk (aligned to 4-character boundaries)
      const chunkBase64 = fileContent.slice(start, end);

      // Send base64 string with data: prefix so backend can recognize it
      // Backend will decode base64 to Buffer: Buffer.from(base64Data, 'base64')
      const partResponse = await app.service("uploads").patch(null, {
        partNumber: i + 1,
        uploadId,
        key,
        content: `data:application/octet-stream;base64,${chunkBase64}`,
      });

      const responseETag =
        Array.isArray(partResponse) && partResponse.length > 0
          ? (partResponse[0] as unknown as { ETag: string; PartNumber: number })
              ?.ETag || ""
          : (partResponse as unknown as { ETag: string; PartNumber: number })
              ?.ETag || "";

      if (!responseETag) {
        console.error("Failed to upload chunk:", i + 1);
        return null;
      }

      parts.push({
        ETag: responseETag,
        PartNumber: i + 1,
      });

      // Update progress
      if (setUploadProgress) {
        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
      }
    }

    // Complete multipart upload
    const completeResponse = await app.service("uploads").update(null, {
      uploadId,
      key,
      parts,
      fileType: contentType,
    });

    console.log("Upload complete response:", completeResponse);
    console.log("Upload complete response type:", typeof completeResponse);

    // Backend returns Media ID (ObjectId string)
    const mediaId = completeResponse;
    // Ensure mediaId is a string (handle both ObjectId and string cases)
    const mediaIdString = mediaId ? String(mediaId) : null;
    console.log("Media ID string:", mediaIdString);
    return mediaIdString;
  } catch (error) {
    console.error("Multipart upload error:", error);
    return null;
  }
};

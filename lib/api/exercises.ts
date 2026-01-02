import { Exercise, ExerciseType, Item } from "../../data/data";
import app from "../feathers/feathers-client";

export interface PopulatedOption {
  _id: string | {};
  word: string;
  imgId: string | {};
  img: {
    name: string;
    fileType: string;
    size?: number;
  };
  audioId: string | {};
  audio: {
    name: string;
    fileType: string;
    size?: number;
  };
  syllablesAudioId: string | {};
  syllablesAudio: {
    name: string;
    fileType: string;
    size?: number;
  };
  categoryId: string | {};
  category?: {
    title: string;
  };
}

export interface PopulatedExercise {
  _id: string | {};
  question: string;
  questionAudioId: string | {};
  questionAudio?: {
    name: string;
    fileType: string;
    size?: number;
  };
  type: string;
  optionIds: (string | {})[];
  options: PopulatedOption[];
  answerId?: string | {};
  answer?: PopulatedOption;
  order: number;
  score: number;
  stageId: string | {};
  stage: {
    order: number;
  };
  updatedAt: number;
  createdAt: number;
}

export interface ExercisesResponse {
  total?: number;
  data: PopulatedExercise[];
  limit?: number;
  skip?: number;
}

/**
 * Fetches exercises for a specific stage from the backend API
 * @param stageId - The ObjectId string of the stage
 * @returns Promise<PopulatedExercise[]> Array of populated exercises sorted by order
 * @throws Error if the API request fails
 */
export const fetchExercisesByStageId = async (
  stageId: string
): Promise<PopulatedExercise[]> => {
  try {
    const response = await app.service("exercises").find({
      query: {
        stageId: stageId,
        $sort: { order: 1 },
      },
    });

    // Handle both paginated and non-paginated responses
    const exercisesData: PopulatedExercise[] = Array.isArray(response)
      ? response
      : (response as ExercisesResponse).data || [];

    // Sort by order to ensure correct display order
    const sortedExercises = [...exercisesData].sort(
      (a, b) => a.order - b.order
    );

    return sortedExercises;
  } catch (error: any) {
    throw new Error(error.message || "Failed to load exercises");
  }
};

/**
 * Maps API exercise type to ExerciseType enum
 * @param apiType - The exercise type from API (e.g., "odd_one_out", "look_and_say", etc.)
 * @returns ExerciseType enum value
 */
export const mapApiTypeToExerciseType = (apiType: string): ExerciseType => {
  switch (apiType) {
    case "odd_one_out":
      return ExerciseType.ODD_ONE_OUT;
    case "look_and_say":
      return ExerciseType.LOOK_AND_SAY;
    case "shape_match":
      return ExerciseType.SHAPE_MATCH;
    case "picture_puzzle":
      return ExerciseType.PICTURE_PUZZLE;
    case "listen_and_pick":
      return ExerciseType.LISTEN_AND_PICK;
    case "sort_and_group":
      return ExerciseType.SORT_AND_GROUP;
    // Legacy support for old "different" type
    case "different":
      return ExerciseType.ODD_ONE_OUT;
    default:
      return ExerciseType.ODD_ONE_OUT;
  }
};

/**
 * Maps a populated option from API to Item format
 * @param option - PopulatedOption from API
 * @param numericId - Numeric ID to assign to the item
 * @returns Item object
 */
const mapOptionToItem = (option: PopulatedOption, numericId: number): Item => {
  return {
    id: numericId,
    word: option.word,
    imageUrl: option.img.name,
    audioUrl: option.audio.name,
    syllablesAudioUrl: option.syllablesAudio.name,
    categoryId: option.categoryId ? parseInt(String(option.categoryId)) : 0,
  };
};

/**
 * Maps a PopulatedExercise from API to Exercise format and Items array
 * Uses sequential numeric IDs (1, 2, 3...) for items based on options array order
 * @param apiExercise - PopulatedExercise from API
 * @returns Object containing mapped Exercise and Items array
 */
export const mapPopulatedExerciseToExercise = (
  apiExercise: PopulatedExercise
): { exercise: Exercise; items: Item[] } => {
  // Create items from options array with sequential numeric IDs (1, 2, 3...)
  const items: Item[] = apiExercise.options.map((option, index) =>
    mapOptionToItem(option, index + 1)
  );

  // Create a map of original option _id to numeric ID (index + 1)
  const optionIdMap = new Map<string | {}, number>();
  apiExercise.options.forEach((option, index) => {
    optionIdMap.set(option._id, index + 1);
  });

  // Map optionIds to numeric IDs based on options array order
  const mappedOptionIds: number[] = apiExercise.optionIds
    .map((optionId) => optionIdMap.get(optionId))
    .filter((id): id is number => id !== undefined);

  // Map answerId to numeric ID
  const mappedAnswerId: number | undefined = apiExercise.answerId
    ? optionIdMap.get(apiExercise.answerId)
    : undefined;

  // Map the exercise
  // Note: questionAudio.name is already a full S3 URL (constructed by backend hooks with baseUrl)
  const exercise: Exercise = {
    question: apiExercise.question,
    questionAudioUrl: apiExercise.questionAudio?.name, // Full S3 URL from backend
    type: mapApiTypeToExerciseType(apiExercise.type),
    optionIds: mappedOptionIds,
    answerId: mappedAnswerId,
    score: apiExercise.score,
    order: apiExercise.order,
    stageId: apiExercise.stage.order, // Use stage.order as numeric stageId
  };

  return { exercise, items };
};

// Category Type Definition
export interface Category {
  id: number;
  title: string;
}

// Dummy Category Data
export const categories: Category[] = [
  {
    id: 1,
    title: "Animal Sounds",
  },
  {
    id: 2,
    title: "First Words",
  },
  {
    id: 3,
    title: "Colors",
  },
  {
    id: 4,
    title: "Numbers",
  },
  {
    id: 5,
    title: "Shapes",
  },
  {
    id: 6,
    title: "Body Parts",
  },
  {
    id: 7,
    title: "Emotions",
  },
  {
    id: 8,
    title: "Family Members",
  },
  {
    id: 9,
    title: "Food & Drinks",
  },
  {
    id: 10,
    title: "Vehicles",
  },
];

// Stage Type Definition
export interface Stage {
  order: number;
}

// Dummy Stage Data
export const stages: Stage[] = [
  { order: 1 },
  { order: 2 },
  { order: 3 },
  { order: 4 },
  { order: 5 },
  { order: 6 },
  { order: 7 },
  { order: 8 },
  { order: 9 },
  { order: 10 },
];

// Item Type Definition
export interface Item {
  id: number;
  word?: string;
  imageUrl?: string;
  audioUrl?: string;
  syllablesAudioUrl?: string;
  categoryId: number;
}

// Dummy Item Data
export const items: Item[] = [
  {
    id: 1,
    word: "Cat",
    imageUrl: "https://i.postimg.cc/7ZXvXj7c/apple.png",
    audioUrl: "https://example.com/audio/cat.mp3",
    syllablesAudioUrl: "https://example.com/audio/cat-syllables.mp3",
    categoryId: 1, // Animal Sound
  },
  {
    id: 2,
    word: "Dog",
    imageUrl: "https://i.postimg.cc/nhT8TN7P/orange.png",
    audioUrl: "https://example.com/audio/dog.mp3",
    syllablesAudioUrl: "https://example.com/audio/dog-syllables.mp3",
    categoryId: 1, // Animal Sounds
  },
  {
    id: 3,
    word: "Red",
    imageUrl: "https://i.postimg.cc/SxV0VH8P/strawberry.png",
    audioUrl: "https://example.com/audio/red.mp3",
    categoryId: 3, // Colors
  },
  {
    id: 4,
    word: "Blue",
    imageUrl: "https://i.postimg.cc/JzKwKSJd/banana.png",
    audioUrl: "",
    syllablesAudioUrl: "https://example.com/audio/blue-syllables.mp3",
    categoryId: 3, // Colors
  },
];

// Exercise Type Enum
export enum ExerciseType {
  ODD_ONE_OUT = "odd_one_out", // Ortiqchasini top
  LOOK_AND_SAY = "look_and_say", // Rasmga qarab talaffuz qil
  SHAPE_MATCH = "shape_match", // Rasmni shaklga mosla
  PICTURE_PUZZLE = "picture_puzzle", // Pazl yig'ish
}

// Exercise Type Definition
export interface Exercise {
  question: string;
  type: ExerciseType;
  optionIds: number[]; // Array of item IDs
  answerId?: number; // ID of the correct item
  score: number;
  order: number;
  stageId: number;
}

// Dummy Exercise Data
export const exercises: Exercise[] = [
  {
    question: "Which one is different?",
    type: ExerciseType.ODD_ONE_OUT,
    optionIds: [1, 2, 3, 4], // Cat, Dog, Red, Blue
    answerId: 3, // Red is the odd one out (not an animal)
    score: 10,
    order: 1,
    stageId: 1, // Animal Sounds
  },
  {
    question: "Look at the picture and say the word",
    type: ExerciseType.LOOK_AND_SAY,
    optionIds: [1], // Cat
    answerId: 1,
    score: 15,
    order: 2,
    stageId: 1, // Animal Sounds
  },
  {
    question: "Match the shape to the picture",
    type: ExerciseType.SHAPE_MATCH,
    optionIds: [1, 2, 3, 4],
    answerId: 1, // Red, Blue
    score: 20,
    order: 1,
    stageId: 3, // Colors
  },
  {
    question: "Complete the puzzle",
    type: ExerciseType.PICTURE_PUZZLE,
    optionIds: [2], // Dog
    answerId: 2,
    score: 25,
    order: 3,
    stageId: 1, // Animal Sounds
  },
];

import { Item } from "../data/data";

// Module-level items array that can be set dynamically
// Components import this array - we mutate it directly
export const items: Item[] = [];

/**
 * Sets the current items array (used for API-loaded exercises)
 * This mutates the exported items array
 * @param newItems - Array of items to set
 */
export const setItems = (newItems: Item[]): void => {
  // Clear and replace items
  items.length = 0;
  items.push(...newItems);
};


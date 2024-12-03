// src/common/utils.ts

// make search titles look nice
export function toTitleCase(input: string): string {
  const minorWords = new Set([
    "and",
    "the",
    "of",
    "in",
    "on",
    "at",
    "with",
    "a",
    "an",
    "but",
    "or",
    "for",
    "nor",
  ]);

  return input
    .split(" ")
    .map((word, index) =>
      index === 0 ||
      index === input.split(" ").length - 1 ||
      !minorWords.has(word.toLowerCase())
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.toLowerCase()
    )
    .join(" ");
}

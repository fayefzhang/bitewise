// src/common/utils.ts

import { AdvancedSearchPreferences } from "./interfaces";

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

export const interests = [
  "Politics",
  "Climate Change",
  "Technology",
  "Elon Musk",
  "Lifestyle",
  "Cooking",
  "NFL",
  "Literature",
  "High Fashion",
  "Travel",
  "Finance",
  "Investing",
  "Cryptocurrency",
  "Gaming",
  "Esports",
  "Music",
  "Movies",
  "Television",
  "Science",
  "Space Exploration",
  "History",
  "Art",
  "Photography",
  "Health",
  "Fitness",
  "Psychology",
  "Philosophy",
  "Economics",
  "Real Estate",
  "Automotive",
  "Sustainable Living",
  "Renewable Energy",
  "Artificial Intelligence",
  "Cybersecurity",
  "Data Science",
  "Machine Learning",
  "Startups",
  "Entrepreneurship",
  "Small Business",
  "Parenting",
  "Education",
  "World News",
  "Local News",
  "Wildlife",
];

export const sources = [
  "CNN",
  "BBC",
  "Reuters",
  "The New York Times",
  "The Guardian",
  "Al Jazeera",
  "Fox News",
  // ... add more sources here
];

export const defaultSearchPreferences: AdvancedSearchPreferences = {
  from_date: "",
  to_date: "",
  read_time: [],
  bias: [],
  clustering: false,
};

export const defaultUserPreferences = {
  sources: [],
  domains: [],
  exclude_domains: [],
  from_date: "",
  read_time: [],
  bias: [],
  clustering: false,
  topics: ["Climate Change", "Politics", "Technology"],
  location: "",
}

export const defaultAIPreferences = {
  length: "short", // options: {"short", "medium", "long"}
  tone: "formal", // options: {"formal", "conversational", "technical", "analytical"}
  format: "highlights", // options: {"highlights", "bullets", "analysis", "quotes"}
  jargon_allowed: true, // options: {True, False}
};

export const biasRatingLabels = [
  "Left",
  "Left-Center",
  "Center",
  "Right-Center",
  "Right",
  "",
];

export const readTimeLabels = ["Short", "Medium", "Long"];

export const difficultyLabels = ["Easy", "Medium", "Hard", ""];
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

  const majorWords = new Set([
    "us",
    "uk",
    "eu",
    "usa",
    "eu",
    "nato",
    "un",
    "nasa",
    "fbi",
    "cia",
    "nfl",
    "nba",
    "mlb",
    "nhl",
    "ncaa",
  ]);

  return input
    .split(" ")
    .map((word, index) => {
      const lowerWord = word.toLowerCase();
      if (index === 0 || index === input.split(" ").length - 1 || !minorWords.has(lowerWord)) {
        return majorWords.has(lowerWord) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      } else {
        return lowerWord;
      }
    })
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
  "Wildlife",
];

export const sources = [
  "ABC News",
  "Al Jazeera English",
  "Ars Technica",
  "Associated Press",
  "Axios",
  "Bleacher Report",
  "Bloomberg",
  "Breitbart News",
  "Business Insider",
  "Buzzfeed",
  "CBS News",
  "CNN",
  "CNN Spanish",
  "Crypto Coins News",
  "Engadget",
  "Entertainment Weekly",
  "ESPN",
  "ESPN Cric Info",
  "Fortune",
  "Fox News",
  "Fox Sports",
  "Google News",
  "Hacker News",
  "IGN",
  "Mashable",
  "Medical News Today",
  "MSNBC",
  "MTV News",
  "National Geographic",
  "National Review",
  "NBC News",
  "New Scientist",
  "Newsweek",
  "New York Magazine",
  "Next Big Future",
  "NFL News",
  "NHL News",
  "Politico",
  "Polygon",
  "Recode",
  "Reddit /r/all",
  "Reuters",
  "TechCrunch",
  "TechRadar",
  "The American Conservative",
  "The Hill",
  "The Huffington Post",
  "The Next Web",
  "The Verge",
  "The Wall Street Journal",
  "The Washington Post",
  "The Washington Times",
  "Time",
  "USA Today",
  "Vice News",
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
  topics: [],
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
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
  "Yoga",
  "Meditation",
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
  "Personal Finance",
  "DIY Projects",
  "Gardening",
  "Home Improvement",
  "World News",
  "Local News",
  "True Crime",
  "Horror",
  "Comedy",
  "Romance",
  "Science Fiction",
  "Fantasy",
  "Poetry",
  "Comics",
  "Anime",
  "K-Pop",
  "Hip Hop",
  "Classical Music",
  "Golf",
  "Tennis",
  "Basketball",
  "Soccer",
  "Baseball",
  "Formula 1",
  "Cycling",
  "Hiking",
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

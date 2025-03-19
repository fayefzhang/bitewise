// src/common/interfaces.ts

import { Key } from "react";

// Preferences Interface
export interface AdvancedSearchPreferences {
  from_date: string; // this defaults to past 7 days in newsapi code
  to_date: string;
  read_time: string[];
  bias: string[];
  clustering: boolean;
}

// Article Interface
export interface Article {
  id: Key | null | undefined;
  url: string;
  authors: string[];
  imageUrl: string;
  title: string;
  source: string;
  content: string;
  time: string; // date published
  biasRating: string;
  sentiment: string;
  readTime: string;
  difficulty: string;
  relatedSources: RelatedSource[];
  summaries: string[];
  fullContent: string;
  cluster: number;
}

// RelatedSource Interface
export interface RelatedSource {
  id: Key | null | undefined;
  title: string;
  source: string;
  time: string;
  bias: string;
}

// Summary Interface
export interface Summary {
  title: string;
  summary: string;
}

// TopicsArticle Interface
export interface TopicArticles {
  date: string;
  topic: string;
  results: Article[];
}

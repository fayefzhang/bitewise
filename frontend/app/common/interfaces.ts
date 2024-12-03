// src/common/interfaces.ts

// Preferences Interface
export interface Preferences {
  sources: string[]; // for daily news
  domains: string[]; // theoretically same as sources, will add in code later to go from one to another so we only need one
  exclude_domains: string[];
  from_date: string; // this defaults to past 7 days in newsapi code
  read_time: string;
  bias: string;
  clustering: boolean;
}

// Article Interface
export interface Article {
  id: Key | null | undefined;
  url: string;
  imageUrl: string;
  title: string;
  source: string;
  content: string;
  time: string;
  bias: string;
  readTime: string;
  relatedSources: RelatedSource[];
  details: string[];
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

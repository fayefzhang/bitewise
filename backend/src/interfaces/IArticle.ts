import { ISummary } from './ISummary';

export interface IArticle extends Document {
    id: string; // URL  hashed
    content: string;
    datePublished: Date;
    author: string;
    source: string;
    url: string;
    title: string;
    readTime: number; // approx 0 = <2 min, 1 = 2-5 min, 3 = 5+ min
    biasRating: number; // approx 0 = left, 1 = left-center, 2 = left, 3 = right-center, 4 = right
    difficulty: number; // approx 0 = easy, 1 = med, 2 = hard
    imageUrl: string;
    summarizationInformation: ISummary[];
}
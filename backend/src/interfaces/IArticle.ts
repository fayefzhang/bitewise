import {ISummary} from './ISummary';

export interface IArticle extends Document {
    url: string; // primary key
    content?: string;
    datePublished?: Date;
    author?: string;
    source: string;
    title: string;
    readTime?: number; // approx 0 = <2 min, 1 = 2-7 min, 2 = 7+ min
    biasRating?: number; // approx 0 = left, 1 = left-center, 2 = left, 3 = right-center, 4 = right, 5 = unknown
    difficulty?: number; // approx 0 = easy, 1 = med, 2 = hard
    imageUrl?: string;
    summaries?: ISummary[];
}
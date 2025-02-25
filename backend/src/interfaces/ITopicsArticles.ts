import { IArticle } from './IArticle';

export interface ITopicsArticles {
    date?: Date;
    results?: {
        article: {
            biasRating?: number;
            description: string;
            datePublished?: Date;
            source: string;
            title: string;
            url: string;
        };
    }[];
    topic?: string;
}
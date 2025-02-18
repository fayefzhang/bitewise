import { IArticle } from './IArticle';

export interface ITopicsArticles {
    date?: Date;
    results?: {
        article: IArticle;
    }[];
    topic?: string;
}
export interface IQuery {
    date: Date;
    query: string;
    articles: string[]; // join key to IArticle
}
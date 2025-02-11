export interface IQuery {
    id: number;
    date: Date;
    query: string;
    articleIDs: string[]; // join key to IArticle
}
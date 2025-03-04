import {IArticle} from './IArticle';

export interface IDashboard {
    date: Date;
    summary: string;
    clusters: IArticle[][]; // list of lists of articles
    clusterSummaries: string[]; // list of summaries for each cluster
    clusterLabels: string[]; // list of labels for each cluster
    location: string;  // location if local news
    podcast: string;  // s3 link
}
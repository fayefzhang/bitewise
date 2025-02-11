export interface IDashboard {
    date: Date;
    summary: string;
    clusters: string[][]; // list of lists of articles
    clusterSummaries: string[]; // list of summaries for each cluster
    clusterLabels: string[]; // list of labels for each cluster
}
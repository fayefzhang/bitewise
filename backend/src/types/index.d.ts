// will need to add to these, but just giving basic infra for now

export interface SearchRequest {
    query: string;
}

export interface SearchResponse {
    articles: {
        title: string;
        description: string;
        content: string;
        cluster: number;
        order: string;
    }[];
}


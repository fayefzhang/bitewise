export interface IPreference {
    sources?: string[],
    domains?: string[],
    exclude_domains?: string[],
    from_date?: string,
    read_time?: number,
    bias?: number,
    clustering?: boolean,
    topics?: string[],
    location?: string
}
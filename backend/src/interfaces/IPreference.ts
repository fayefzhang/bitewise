export interface IPreference {
    sources?: string[],
    domains?: string[],
    exclude_domains?: string[],
    from_date?: string,
    read_time?: string[],
    bias?: string[],
    clustering?: boolean,
    topics?: string[],
    location?: string
}
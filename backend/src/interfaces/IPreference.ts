export interface IPreference {
    sources?: string[],
    domains?: string[], // TODO: remove
    exclude_domains?: string[],
    from_date?: string,
    read_time?: string[],
    bias?: string[],
    clustering?: boolean,
    topics?: string[],
    location?: string
}
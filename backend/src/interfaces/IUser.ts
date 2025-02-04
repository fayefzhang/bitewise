import { IPreference } from "./IPreference";

export interface IUser {
    id: string;
    email: string;
    password: string;
    preferences: IPreference;
}
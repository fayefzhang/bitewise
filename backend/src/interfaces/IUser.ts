import { IPreference } from "./IPreference";

export interface IUser {
    name: string;
    email: string;
    password: string;
    preferences: IPreference;
}
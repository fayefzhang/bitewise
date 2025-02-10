import { IPreference } from "./IPreference";

export interface IUser {
    email: string;
    password: string;
    preferences: IPreference;
}
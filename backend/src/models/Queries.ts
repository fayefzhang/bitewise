import mongoose, { Schema } from 'mongoose';
import { IQuery } from '../interfaces/IQuery';

const QuerySchema: Schema = new Schema<IQuery>({
    id: { type: Number, unique: true },
    date: { type: Date },
    query: { type: String },
    articleIDs: [{ type: String, ref: 'Article' }]
});
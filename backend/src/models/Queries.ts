import mongoose, { Schema } from 'mongoose';
import { IQuery } from '../interfaces/IQuery';

const QuerySchema: Schema = new Schema<IQuery>({
    date: { type: Date },
    query: { type: String, unique: true },
    articles: [{ type: String, ref: 'Article' }]
});

export default mongoose.model<IQuery>('Query', QuerySchema);
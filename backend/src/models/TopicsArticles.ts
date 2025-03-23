import mongoose, { Schema } from 'mongoose';
import { ITopicsArticles } from '../interfaces/ITopicsArticles';

const TopicsArticlesSchema: Schema = new Schema<ITopicsArticles>({
    date: { type: Date },
    results: {
        type: [{
            article: {
                biasRating: { type: Number, enum: [0, 1, 2, 3, 4, 5] },
                description: { type: String },
                datePublished: { type: Date },
                source: { type: String },
                title: { type: String, required: true },
                url: { type: String, required: true, unique: false },
                readTime: { type: Number, enum: [0, 1, 2] },
            }
        }]
    },
    topic: { type: String },
});

export default mongoose.model<ITopicsArticles>('TopicsArticles', TopicsArticlesSchema);
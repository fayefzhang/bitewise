import mongoose, { Schema } from 'mongoose';
import { IArticle } from '../interfaces/IArticle';

const ArticleSchema: Schema = new Schema<IArticle>({
  content: { type: String },
  datePublished: { type: Date },
  author: { type: String },
  source: { type: String },
  url: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  readTime: { type: Number, enum: [0, 1, 2]},
  biasRating: { type: Number, enum: [0, 1, 2, 3, 4, 5] },
  difficulty: { type: Number, enum: [0, 1, 2] },
  imageUrl: { type: String },
  summaries: [{
    summary: { type: String, required: true },
    AILength: { type: Number, enum: [0, 1, 2], required: true },
    AITone: { type: Number, enum: [0, 1, 2, 3], required: true },
    AIFormat: { type: Number, enum: [0, 1, 2, 3], required: true },
    AIJargonAllowed: { type: Number, enum: [0, 1], required: true },
  }]
});

export default mongoose.model<IArticle>('Article', ArticleSchema);
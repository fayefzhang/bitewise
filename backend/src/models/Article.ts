import mongoose, { Schema } from 'mongoose';
import { IArticle } from '../interfaces/IArticle';

const ArticleSchema: Schema = new Schema<IArticle>({
  url: { type: String, required: true, unique: true },
  content: { type: String },
  datePublished: { type: Date },
  authors: [{ type: String }],
  source: { type: String },
  title: { type: String, required: true },
  readTime: { type: Number, enum: [0, 1, 2]},
  biasRating: { type: Number, enum: [0, 1, 2, 3, 4, 5] },
  difficulty: { type: Number, enum: [0, 1, 2] },
  imageUrl: { type: String },
  summaries: [{
    summary: { type: String },
    AILength: { type: Number, enum: [0, 1, 2] },
    AITone: { type: Number, enum: [0, 1, 2, 3] },
    AIFormat: { type: Number, enum: [0, 1, 2, 3] },
    AIJargonAllowed: { type: Number, enum: [0, 1] },
    s3Url: { type: String, default: "" }
  }]
});

export default mongoose.model<IArticle>('Article', ArticleSchema);
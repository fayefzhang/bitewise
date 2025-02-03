import mongoose, { Schema } from 'mongoose';
import { SummarySchema } from './Summary';
import { IArticle } from '../interfaces/IArticle';

const ArticleSchema: Schema = new Schema<IArticle>({
  id: { type: String, required: true },
  associatedQueries: { type: [String], required: true },
  content: { type: String, required: true },
  datePublished: { type: Date, required: true },
  author: { type: String },
  source: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  readTime: { type: Number },
  biasRating: { type: Number },
  difficulty: { type: Number },
  imageUrl: { type: String },
  summarizationInformation: [SummarySchema],
});

export default mongoose.model<IArticle>('Article', ArticleSchema);
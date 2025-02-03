import mongoose, { Schema } from 'mongoose';
import { ISummary } from '../interfaces/ISummary';


const SummarySchema: Schema = new Schema<ISummary>({
    summary: { type: String, required: true },
    AILength: { type: Number, enum: [0, 1, 2], required: true }, // 0 = short, 1 = medium, 2 = long
    AITone: { type: Number, enum: [0, 1, 2, 3], required: true }, // 0 = formal, 1 = conversational, 2 = technical, 3 = analytical
    AIFormat: { type: Number, enum: [0, 1, 2, 3], required: true }, // 0 = highlights, 1 = bullets, 2 = analysis, 3 = quotes
    AIJargonAllowed: { type: Boolean, required: true }, // True or False for allowing jargon
  });
  
  export { SummarySchema };
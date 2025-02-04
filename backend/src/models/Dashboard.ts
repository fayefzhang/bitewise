import mongoose, { Schema } from 'mongoose';
import { IDashboard } from '../interfaces/IDashboard';

const DashboardSchema: Schema = new Schema<IDashboard>({
    date: { type: Date },
    summary: { type: String },
    clusters: { type: [[String]] },
    clusterSummaries: { type: [String] },
    clusterLabels: { type: [String] }
});

export default mongoose.model<IDashboard>('Dashboard', DashboardSchema);
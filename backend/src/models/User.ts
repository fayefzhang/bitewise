import mongoose, { Schema} from 'mongoose';
import { IUser } from '../interfaces/IUser';

const UserSchema: Schema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    preferences: {
        sources: { type: [String], default: [] },
        domains: { type: [String], default: [] },
        exclude_domains: { type: [String], default: [] },
        from_date: { type: String, default: "" },
        read_time: { type: Number, default: null },
        bias: { type: Number, default: 0 },
        clustering: { type: Boolean, default: false },
        topics: { type: [String], default: [] },
        location: { type: String, default: "" }
    }
});

export default mongoose.model<IUser>('User', UserSchema);
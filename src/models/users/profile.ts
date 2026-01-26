import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ProfileDocument extends Document {
    userId: mongoose.Types.ObjectId;
    image: string
}

const profileSchema = new Schema<ProfileDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    image: {
        type: String,
        required: true,
    }
}, { timestamps: true })

export const Profile: Model<ProfileDocument> = mongoose.models.Profile || mongoose.model<ProfileDocument>("Profile", profileSchema);
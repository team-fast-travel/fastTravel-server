import mongoose, { Schema, type Model, type Document } from "mongoose";

export type TopLanguages =
    | "English"
    | "French"
    | "Punjabi"
    | "Mandarin"
    | "Arabic"
    | "Cantonese"
    | "Spanish"
    | "Tagalog"
    | "Italian"
    | "German"
    | "Urdu"
    | "Portuguese"
    | "Hindi"
    | "Vietnamese"
    | "Persian";

export interface UserDocument extends Document {
    firstName: string;
    lastName: string;
    gender: string;
    languages: TopLanguages[];
    email: string;
    phone: string;
    password: string;
    province: string;
    city: string;
}

const userSchema = new Schema<UserDocument>({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    languages: {
        type: [String],
      enum: [
        "English",
        "French",
        "Punjabi",
        "Mandarin",
        "Arabic",
        "Cantonese",
        "Spanish",
        "Tagalog",
        "Italian",
        "German",
        "Urdu",
        "Portuguese",
        "Hindi",
        "Vietnamese",
        "Persian",
      ] as TopLanguages[],
      default: ["English"],
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    province: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
}, { timestamps: true });

export const User: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);
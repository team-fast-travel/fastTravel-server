import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface UserDocument extends Document {
    firstName: string;
    lastName: string;
    gender: string;
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
import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface CodeDocument extends Document {
    email: string;
    code: string;
    codeExpiration: Date;
}

const verificationCodeSchema = new Schema<CodeDocument>({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    code: {
        type: String,
        required: true
    },
    codeExpiration: {
        type: Date,
        required: true
    }
}, { timestamps: true })

export const VerificationCode: Model<CodeDocument> = mongoose.models.VerificationCode || mongoose.model<CodeDocument>("VerificationCode", verificationCodeSchema)
import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface ReviewDocument extends Document {
    userId: mongoose.Types.ObjectId;
    reviewerId: mongoose.Types.ObjectId;
    star: number;
    comment: string;
    likes: number;
    dislikes: number;
    sentAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reviewerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    star: {
        type: Number,
        min: 1, 
        max: 5,
        required: true,
    },
    comment: {
        type: String,
        default: ""
    },
    likes: {
        type: Number,
        default: 0,
    },
    dislikes: {
        type: Number,
        default: 0,
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

export const Reviews: Model<ReviewDocument> = mongoose.models.Reviews || mongoose.model('Reviews', reviewSchema);
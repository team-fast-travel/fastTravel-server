import mongoose, { Schema, type Document, type Model } from "mongoose";

interface Members {
    user: mongoose.Types.ObjectId;
    joined_at: string;
}

export interface GroupDocument extends Document {
    groupName: string;
    bio: string;
    admins: mongoose.Types.ObjectId[];
    members: Members[];
}

const memberSchema = new Schema<Members>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        joined_at: {
            type: String,
            required: true
        },
    },
    { _id: false }
);

const groupSchema = new Schema<GroupDocument>({
    groupName: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        required: true
    },
    admins: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    members: {
        type: [memberSchema],
        required: true,
        default: [],
    },
}, { timestamps: true });

export const Group: Model<GroupDocument> = mongoose.models.Group || mongoose.model<GroupDocument>("Group", groupSchema);
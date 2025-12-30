import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ChatDocument extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    messageType: "Text" | "Image" | "File";
    message: string;
    fileUrl: string;
    created_at: string;
    seen: boolean;
    seen_at: string;
}

const chatSchema = new Schema<ChatDocument>(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        messageType: {
            type: String,
            enum: ["Text", "Image", "File"],
            required: true,
        },
        message: {
            type: String,
            required: function (this: ChatDocument) {
                return this.messageType === "Text";
            },
        },
        fileUrl: {
            type: String,
            required: function (this: ChatDocument) {
                return this.messageType !== "Text";
            },
        },
        created_at: {
            type: String,
            default: () => new Date().toISOString(),
        },
        seen: {
            type: Boolean,
            default: false,
        },
        seen_at: {
            type: String,
            default: "",
        },
    },
    { timestamps: false }
);

export const Chat: Model<ChatDocument> =
    mongoose.models.Chat ||
    mongoose.model<ChatDocument>("Chat", chatSchema);

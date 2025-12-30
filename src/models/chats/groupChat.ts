import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface GroupChatDocument extends Document {
    groupId: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    messageType: "Text" | "Image" | "File";
    message: string;
    fileUrl: string;
    seenBy: mongoose.Types.ObjectId[];
}

const groupChatSchema = new Schema<GroupChatDocument>(
    {
        groupId: {
            type: mongoose.Types.ObjectId,
            ref: 'Group',
            required: true
        },
        sender: {
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
            required: function (this: GroupChatDocument) {
                return this.messageType === "Text";
            },
        },
        fileUrl: {
            type: String,
            required: function (this: GroupChatDocument) {
                return this.messageType !== "Text";
            },
        },
        seenBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                default: [],
            },
        ],
    },
    { timestamps: true }
);

export const GroupChat: Model<GroupChatDocument> =
    mongoose.models.GroupChat ||
    mongoose.model<GroupChatDocument>("GroupChat", groupChatSchema);



import mongoose, { Schema, type Document, type Model } from "mongoose";

export type NotificationType =
  | "GENERAL"
  | "RIDE_UPDATE"
  | "PAYMENT"
  | "CHAT"
  | "SYSTEM";

export interface NotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  data?: Record<string, any>;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    notification_type: {
      type: String,
      enum: ["GENERAL", "RIDE_UPDATE", "PAYMENT", "CHAT", "SYSTEM"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    read_at: {
      type: String,
      default: "",
    },
    data: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export const Notification: Model<NotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", notificationSchema);

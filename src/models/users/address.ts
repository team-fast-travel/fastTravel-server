import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface AddressDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  address: string;
  province: string;
  city: string;
  postal_code: string;
}

const addressSchema = new Schema<AddressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    province: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    postal_code: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// prevent duplicate titles per user (e.g., only one "Home")
addressSchema.index({ userId: 1, title: 1 }, { unique: true });

export const Address: Model<AddressDocument> =
  mongoose.models.Address ||
  mongoose.model<AddressDocument>("Address", addressSchema);

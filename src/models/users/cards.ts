import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface CardDocument extends Document {
  userId: mongoose.Types.ObjectId;
  card_no: string;
  card_cvv: string;
  card_date: string;
  card_first_name: string;
  card_last_name: string;
}

const cardSchema = new Schema<CardDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    card_no: {
      type: String,
      required: true,
      minlength: 12,
      maxlength: 19,
    },
    card_cvv: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 4,
    },
    card_date: {
      type: String, 
      required: true,
    },
    card_first_name: {
      type: String,
      required: true,
      trim: true,
    },
    card_last_name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// same user can't add same card twice
cardSchema.index({ userId: 1, card_no: 1 }, { unique: true });

export const Card: Model<CardDocument> =
  mongoose.models.Card || mongoose.model<CardDocument>("Card", cardSchema);

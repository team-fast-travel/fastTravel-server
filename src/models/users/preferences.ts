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

export type CarFeature =
    | "Air Conditioning"
    | "Heated Seats"
    | "Bluetooth"
    | "Sunroof"
    | "Leather Seats"
    | "USB Charging"
    | "Wi-Fi"
    | "Pet Friendly"
    | "Child Seat"
    | "Music System";

export interface PreferenceDocument extends Document {
    userId: mongoose.Types.ObjectId;
    driverGender: "male" | "female" | "both" | "non-binary";
    language: TopLanguages[];
    carFeatures: CarFeature[];
}

const preferenceSchema = new Schema<PreferenceDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    driverGender: {
      type: String,
      enum: ["male", "female", "both", "non-binary"],
      required: true,
    },
    language: {
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
      default: [],
    },
    carFeatures: {
      type: [String],
      enum: [
        "Air Conditioning",
        "Heated Seats",
        "Bluetooth",
        "Sunroof",
        "Leather Seats",
        "USB Charging",
        "Wi-Fi",
        "Pet Friendly",
        "Child Seat",
        "Music System",
      ] as CarFeature[],
      default: [],
    },
}, { timestamps: true });

export const Preference: Model<PreferenceDocument> = mongoose.models.Preference || mongoose.model<PreferenceDocument>("Preference", preferenceSchema);
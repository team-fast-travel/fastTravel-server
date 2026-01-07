import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface BookRideDocument extends Document {
    rideId: mongoose.Types.ObjectId;
    bookerId: mongoose.Types.ObjectId;
    pickup_address: string;
    drop_off_address: string;
    bookStatus: "Active" | "Complete" | "Rebook" | "Cancelled";
}

const bookRideSchema = new Schema<BookRideDocument>({
    rideId: {
        type: Schema.Types.ObjectId,
        ref: "Ride",
        required: true,
    },
    bookerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    pickup_address: {
        type: String,
        required: true
    },
    drop_off_address: {
        type: String,
    },
    bookStatus: {
        type: String,
        enum: ["Active", "Complete", "Rebook", "Cancelled"],
        default: "Active"
    }
}, { timestamps: true });

export const BookRide: Model<BookRideDocument> = mongoose.models.BookRide || mongoose.model<BookRideDocument>("BookRide", bookRideSchema);
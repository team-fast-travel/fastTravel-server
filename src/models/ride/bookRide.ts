import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface BookRideDocument extends Document {
    rideId: mongoose.Types.ObjectId;
    bookerId: mongoose.Types.ObjectId;
    pickup_address: string;
    drop_off_address: string;
    seat: {
        seatType: 'front' | 'middle' | 'back';
        indices: number[];  // Specific seat indices booked
    };
    accepted: boolean;
    bookStatus: "Active" | "Under Review" | "Complete" | "Rebook" | "Cancelled" | "Declined";
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
    seat: {
        seatType: {
            type: String,
            enum: ['front', 'middle', 'back'],
            required: true
        },
        indices: {
            type: [Number],
            required: true,
            validate: {
                validator: function(v: number[]) {
                    return v.length > 0;
                },
                message: "At least one seat index must be specified"
            }
        }
    },
    accepted: {
        type: Boolean,
        default: false
    },
    bookStatus: {
        type: String,
        enum: ["Active", "Complete", "Rebook", "Cancelled"],
        default: "Active"
    }
}, { timestamps: true });

export const BookRide: Model<BookRideDocument> = mongoose.models.BookRide || mongoose.model<BookRideDocument>("BookRide", bookRideSchema);
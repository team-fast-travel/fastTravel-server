import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface RideSeats {
    front: number;
    middle: number;
    back: number;
}

export interface BookedSeat {
    seatType: 'front' | 'middle' | 'back';
    seatIndex: number;
    bookingId: mongoose.Types.ObjectId;
}

export interface RideDocument extends Document {
    driverId: mongoose.Types.ObjectId;
    vehicleId: mongoose.Types.ObjectId;
    description: string;
    price: number;
    start_location: string;
    drop_off: string;
    final_end_location: string;
    departure_date: string;
    departure_time: string;
    route_type: "Fixed" | "Flexible";
    status: 'Static' | 'In progress' | 'Active' | 'Completed';
    availableSeats: RideSeats;
    bookedSeats: BookedSeat[];
}

const rideSchema = new Schema<RideDocument>(
    {
        driverId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        vehicleId: {
            type: Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true,
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        start_location: {
            type: String,
            required: true
        },
        drop_off: {
            type: String,
            required: true
        },
        final_end_location: {
            type: String,
            required: true
        },
        departure_date: {
            type: String,
            required: true
        },
        departure_time: {
            type: String,
            required: true
        },
        route_type: {
            type: String,
            enum: ["Fixed", "Flexible"],
            required: true,
        },
        status: {
            type: String,
            enum: ['Static', 'In progress', 'Active', 'Completed'],
            default: "Static"
        },
        availableSeats: {
            front: {
                type: Number,
                default: 1, // Only 1 available for passengers (driver takes 1)
                min: 0
            },
            middle: {
                type: Number,
                default: 0,
                min: 0
            },
            back: {
                type: Number,
                default: 0,
                min: 0
            }
        },
        bookedSeats: [
            {
                seatType: {
                    type: String,
                    enum: ['front', 'middle', 'back'],
                    required: true
                },
                seatIndex: {
                    type: Number,
                    required: true
                },
                bookingId: {
                    type: Schema.Types.ObjectId,
                    ref: "BookRide",
                    required: true
                }
            }
        ]
    },
    { timestamps: true }
);

export const Ride: Model<RideDocument> = mongoose.models.Ride || mongoose.model<RideDocument>("Ride", rideSchema);

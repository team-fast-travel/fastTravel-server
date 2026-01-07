import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface RideDocument extends Document {
    driverId: mongoose.Types.ObjectId;
    vehicleId: mongoose.Types.ObjectId;
    picture: string;
    description: string;
    start_location: string;
    drop_off: string;
    final_end_location: string;
    departure_date: string;
    departure_time: string;
    route_type: "Fixed" | "Flexible";
    seats: {
        front: number;
        middle: number;
        back: number;
    };
    status: 'Static' | 'In progress' | 'Active' | 'Completed';
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
        picture: {
            type: String,
            required: true
        },
        description: {
            type: String,
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
        seats: {
            front: {
                type: Number,
                min: 0,
                max: 2,
                required: true,
                default: 1,
            },
            middle: {
                type: Number,
                min: 0,
                max: 3,
                required: true,
                default: 2,
            },
            back: {
                type: Number,
                min: 0,
                max: 3,
                required: true,
                default: 0,
            },
        },
        status: {
            type: String,
            enum: ['Static', 'In progress', 'Active', 'Completed']
        }
    },
    { timestamps: true }
);

export const Ride: Model<RideDocument> = mongoose.models.Ride || mongoose.model<RideDocument>("Ride", rideSchema);

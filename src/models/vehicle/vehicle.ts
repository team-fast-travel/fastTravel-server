import mongoose, { Schema, type Document, type Model } from "mongoose";

interface RideSeats {
    front_seat: string;
    back_seat: string;
    middle_seat: string;
}

export interface VehicleDocument extends Document {
    driverId: mongoose.Types.ObjectId;
    carName: string;
    carType: string;
    carModel: string;
    year: number;
    color: string;
    plateNumber: string;
    vin: string;
    vehiclePhoto: string;
    seats: RideSeats;
    vehicleFeatures: string[];
}

const vehicleSchema = new Schema<VehicleDocument>(
    {
        driverId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        carName: {
            type: String,
            required: true
        },
        carType: {
            type: String,
            required: true
        },
        carModel: {
            type: String,
            required: true
        },
        year: {
            type: Number,
            required: true
        },
        color: {
            type: String,
            required: true

        },
        plateNumber: {
            type: String,
            required: true,
            unique: true
        },
        vin: {
            type: String,
            required: true,
            unique: true
        },
        vehiclePhoto: {
            type: String,
            required: true
        },
        seats: {
            front_seat: {
                type: String,
                required: true
            },
            back_seat: {
                type: String,
                required: true
            },
            middle_seat: {
                type: String,
                required: true
            },
        },
        vehicleFeatures: [{
            type: String,
            required: false
        }],
    },
    { timestamps: true }
);

export const Vehicle: Model<VehicleDocument> =
    mongoose.models.Vehicle ||
    mongoose.model<VehicleDocument>("Vehicle", vehicleSchema);

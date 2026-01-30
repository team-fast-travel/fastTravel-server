import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { CarFeature } from "../users/preferences.js";

interface RideSeats {
    front_seat: number;
    back_seat: number;
    middle_seat: number;
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
    vehicleFeatures: CarFeature[];
    status: 'Not verified' | 'Under review' | 'Verified';
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
                type: Number,
                required: true
            },
            back_seat: {
                type: Number,
                required: true
            },
            middle_seat: {
                type: Number,
                required: true
            },
        },
        vehicleFeatures: {
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
        status: {
            type: String,
            enum: ['Not verified', 'Under review', 'Verified'],
            default: 'Not verified'
        }
    },
    { timestamps: true }
);

export const Vehicle: Model<VehicleDocument> =
    mongoose.models.Vehicle ||
    mongoose.model<VehicleDocument>("Vehicle", vehicleSchema);

import { getSocket } from "../../config/connection.js";
import { User } from "../../models/users/user.js";
import type { Request, Response } from "express";
import { Vehicle, type VehicleDocument } from "../../models/vehicle/vehicle.js";

export const createVehicleByUser = async (req: Request<{}, any, VehicleDocument>, res: Response) => {
    const userId = req.user.id;
    const { driverId, carName, carModel, year, collection, plateNumber, vin, vehicleFeatures, vehiclePhoto, seats } = req.body;

    if (!driverId || !carModel || !carName || !year || !collection || !plateNumber || !vin || !vehicleFeatures || !vehiclePhoto || !seats) {
        return res.status(400).json({ message: "All vechile fields are required" });
    }

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const newVehicle = await Vehicle.create(req.body);

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("new_vehicle", newVehicle);

        return res.status(201).json({
            message: "Vehicle created successfully",
            data: newVehicle,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to create Vehicle",
        });
    }
};

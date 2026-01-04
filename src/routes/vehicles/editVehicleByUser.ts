import { getSocket } from "../../config/connection.js";
import type { VehicleEditParams } from "../../interface/interface.js";
import { Vehicle } from "../../models/vehicle/vehicle.js";
import { User } from "../../models/users/user.js";
import type { Request, Response } from "express";

export const editVehicleByUser = async (req: Request<VehicleEditParams>, res: Response) => {
    const userId = req.user.id;
    const { vehicleId } = req.params;

    if (!vehicleId) {
        return res.status(400).json({
            messgae: "Vehicle ID is required"
        })
    }

    try {
        // Ensure rider exist
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        // Ensure Vehicle exist
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

        // Ensure user owns Vehicle
        if (vehicle.driverId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        Object.assign(Vehicle, req.body);
        await vehicle.save();

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("vehicle_updated", vehicle);

        return res.status(200).json({
            message: "Vehicle updated successfully",
            data: vehicle
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to update Vehicle",
        });
    }
};

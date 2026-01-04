import { getSocket } from "../../config/connection.js";
import type { VehicleEditParams } from "../../interface/interface.js";
import { User } from "../../models/users/user.js";
import type { Request, Response } from "express";
import { Vehicle } from "../../models/vehicle/vehicle.js";

export const deleteVehicleByUser = async (req: Request<VehicleEditParams>, res: Response) => {
    const userId = req.user.id;
    const { vehicleId } = req.params;

    if(!vehicleId) {
        return res.status(400).json({
            messgae: "Vehicle ID is required"
        })
    }

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        // Ensure Vehicle exists
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

        if (vehicle.driverId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Vehicle.findByIdAndDelete(vehicleId);

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("vehicle_deleted", vehicle);

        return res.status(200).json({
            message: "Vehicle deleted successfully",
            data: vehicle,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to delete vehicle",
        });
    }
};

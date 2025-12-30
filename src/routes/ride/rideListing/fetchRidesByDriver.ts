import { Ride } from "../../../models/ride/ride.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchRidesByDriver = async (req: Request, res: Response) => {
    const driverId = req.user.id;

    try {
        // Ensure driver exists
        const driver = await User.findById(driverId);
        if (!driver) return res.status(404).json({
            message: "Driver not found"
        });

        const rides = await Ride.find({ driverId }).sort({
            createdAt: -1,
        })
            .populate("driverId")
            .populate("vehicleId") || [];

        return res.status(200).json({
            message: "Rides fetched successfully",
            data: rides,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to fetch rides for driver",
        });
    }
};

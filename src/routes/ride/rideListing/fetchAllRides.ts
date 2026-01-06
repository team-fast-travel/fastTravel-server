/**
 * @swagger
 * /fetch_all_ride:
 *   get:
 *     summary: Fetch all rides
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All rides
 *       500:
 *         description: Server error
 */
import { Ride } from "../../../models/ride/ride.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";
import mongoose from "mongoose";

export const fetchAllRides = async (req: Request, res: Response) => {
    const userId = req.user.id;

    try {
        // Ensure driver exists
        const driver = await User.findById(userId);
        if (!driver) return res.status(404).json({
            message: "Driver not found"
        });


        const currentDriverId = new mongoose.Types.ObjectId(userId);

        const rides = await Ride.find({
            driverId: { $ne: currentDriverId }
        }).sort({ createdAt: -1 }).populate("driverId").populate("vehicleId") || [];

        return res.status(200).json({
            message: "Rides fetched successfully",
            data: rides,
        });

    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to fetch rides",
        });
    }
}
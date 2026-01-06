/**
 * @openapi
 * /fetch_vehicles_by_user/{userId}:
 *   get:
 *     tags:
 *       - Vehicle
 *     summary: Fetch vehicles for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicles list
 */
import { Vehicle } from "../../models/vehicle/vehicle.js";
import type { Request, Response } from "express";
import { User } from "../../models/users/user.js";

export const fetchVehicleByUser = async (req: Request, res: Response) => {
    const userId = req.user.id;

    try {
        // Ensure user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const vehicles = await Vehicle.find({ userId }).sort({
            createdAt: -1,
        }).populate("userId") || [];

        return res.status(200).json({
            message: "Vehicles fetched successfully",
            data: vehicles,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to fetch vehicles",
        });
    }
};

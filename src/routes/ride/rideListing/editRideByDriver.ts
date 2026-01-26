/**
 * @swagger
 * /edit_ride/{rideId}:
 *   put:
 *     summary: Edit a ride listing
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ride ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Ride updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import type { RideEditParams } from "../../../interface/interface.js";
import { Ride } from "../../../models/ride/ride.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const editRideByDriver = async (req: Request<RideEditParams>, res: Response) => {
    const driverId = req.user.userId;
    const { rideId } = req.params;

    try {
        // Ensure driver exist
        const driver = await User.findById(driverId);
        if (!driver) return res.status(404).json({
            message: "Driver not found"
        });

        // Ensure ride exists
        const ride = await Ride.findById(rideId);
        if (!ride) return res.status(404).json({ message: "Ride not found" });

        if (ride.driverId.toString() !== driverId.toString()) {
            return res
                .status(403)
                .json({ message: "You cannot edit someone else's ride" });
        }

        // Selectively update provided fields
        Object.assign(ride, req.body);

        await ride.save();

        // Emit socket
        const io = getSocket();
        io?.to("fastTravel_global_room").emit("ride_updated", ride)

        return res.status(200).json({
            message: "Ride updated successfully",
            data: ride,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to update ride",
        });
    }
};

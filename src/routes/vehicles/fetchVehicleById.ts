/**
 * @openapi
 * /fetch_vehicle/{vehicleId}:
 *   get:
 *     tags:
 *       - Vehicle
 *     summary: Fetch a vehicle by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: vehicleId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle data
 */
import { Vehicle } from "../../models/vehicle/vehicle.js";
import type { Request, Response } from "express";
import type { VehicleEditParams } from "../../interface/interface.js";

export const fetchVehicleById = async (req: Request<VehicleEditParams>, res: Response) => {
    const userId = req.user.userId;
    const { vehicleId } = req.params;

    try {
        // Ensure rider exists
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                message: "Vehicle not found"
            })
        };

        if (vehicle.driverId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        return res.status(200).json({
            message: "Vehicle fetched successfully",
            data: vehicle,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to fetch vehicle",
        });
    }
};

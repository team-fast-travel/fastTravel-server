/**
 * @swagger
 * /create_ride:
 *   post:
 *     summary: Create a ride listing
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_location:
 *                 type: string
 *               drop_off:
 *                 type: string
 *               departure_date:
 *                 type: string
 *               departure_time:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ride created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import { Ride } from "../../../models/ride/ride.js";
import { Vehicle } from "../../../models/vehicle/vehicle.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyRequest {
    driverId: string;
    vehicleId: string;
    description: string;
    price: number;
    start_location: string;
    drop_off: string;
    final_end_location: string;
    departure_date: string;
    departure_time: string;
    route_type: string;
}

export const createRide = async (req: Request<{}, any, BodyRequest>, res: Response) => {
    const driverId = req.user.userId;

    const {
        vehicleId,
        description,
        price,
        start_location,
        drop_off,
        final_end_location,
        departure_date,
        departure_time,
        route_type,
    } = req.body;

    try {
        // driver exists?
        const driver = await User.findById(driverId);
        if (!driver) return res.status(404).json({
            message: "Driver not found"
        });

        // vehicle exists?
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) return res.status(404).json({
            message: "Vehicle not found"
        });

        // Initialize available seats based on vehicle capacity
        // Front seat: max 2 total, 1 for driver, so 1 available for passengers
        // Middle and back seats: based on vehicle configuration
        const availableSeats = {
            front: 1, // Always 1 available for passengers (driver takes 1)
            middle: vehicle.seats.middle_seat || 0,
            back: vehicle.seats.back_seat || 0
        };

        // create ride
        const ride = await Ride.create({
            driverId,
            vehicleId,
            description,
            price,
            start_location,
            drop_off,
            final_end_location,
            departure_date,
            departure_time,
            route_type,
            availableSeats,
        });

        // Emit socket
        const io = getSocket();
        io?.to("fastTravel_global_room").emit("new_ride", ride)

        return res.status(201).json({
            message: "Ride created successfully",
            data: ride,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to create ride",
        });
    }
};

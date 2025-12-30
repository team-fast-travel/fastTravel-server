import { getSocket } from "../../../config/connection.js";
import { Ride } from "../../../models/ride/ride.js";
import { BookRide } from "../../../models/ride/bookRide.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyRequest {
    rideId: string;
    bookerId: string;
    pickup_address: string;
    drop_off_address: string;
}

export const createBooking = async (req: Request<{}, any, BodyRequest>, res: Response) => {
    const bookerId = req.user.id;

    const {
        rideId,
        pickup_address,
        drop_off_address,
    } = req.body;

    try {
        // User exists?
        const rider = await User.findById(bookerId);
        if (!rider) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        // Ensure ride exists
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({
                message: "Ride not found"
            })
        };

        // Create booking
        const bookRide = await BookRide.create({
            rideId,
            bookerId,
            pickup_address,
            drop_off_address,
        });

        // Emit socket
        const io = getSocket();
        io?.to(bookerId.toString()).emit("new_book_ride", bookRide)

        return res.status(201).json({
            message: "Booked ride successfully",
            data: bookRide,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to book ride",
        });
    }
}
/**
 * @swagger
 * /fetch_booking:
 *   get:
 *     summary: Fetch bookings for authenticated rider
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
import { BookRide } from "../../../models/ride/bookRide.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchBookingByRider = async (req: Request, res: Response) => {
    const bookerId = req.user.id;

    try {
        // Ensure rider exists
        const rider = await User.findById(bookerId);
        if (!rider) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const bookRide = await BookRide.find({ bookerId }).sort({
            createdAt: -1,
        })
            .populate("rideId")
            .populate("bookerId") || [];

        return res.status(200).json({
            message: "Rides fetched successfully",
            data: bookRide,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to fetch ride",
        });
    }
}
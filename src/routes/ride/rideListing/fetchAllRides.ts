/**
 * @swagger
 * /fetch_all_ride:
 *   get:
 *     summary: Fetch all rides excluding the authenticated driver's rides
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rides fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Rides fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 65f1c3e4a2b4d3a1
 *                       driverId:
 *                         $ref: '#/components/schemas/User'
 *                       vehicleId:
 *                         $ref: '#/components/schemas/Vehicle'
 *                       description:
 *                         type: string
 *                         example: Comfortable ride to downtown
 *                       price:
 *                         type: number
 *                         example: 30
 *                       start_location:
 *                         type: string
 *                         example: Airport
 *                       drop_off:
 *                         type: string
 *                         example: City Center
 *                       final_end_location:
 *                         type: string
 *                         example: Downtown
 *                       departure_date:
 *                         type: string
 *                         example: 2026-01-23
 *                       departure_time:
 *                         type: string
 *                         example: 12:00:00
 *                       route_type:
 *                         type: string
 *                         enum: [Fixed, Flexible]
 *                       status:
 *                         type: string
 *                         enum: [Static, In progress, Active, Completed]
 *                       driverReview:
 *                         type: object
 *                         properties:
 *                           averageRating:
 *                             type: number
 *                             example: 4.5
 *                           totalReviews:
 *                             type: number
 *                             example: 12
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */

import { Ride } from "../../../models/ride/ride.js";
import { BookRide } from "../../../models/ride/bookRide.js";
import { Reviews } from "../../../models/users/reviews.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";
import mongoose from "mongoose";

export const fetchAllRides = async (req: Request, res: Response) => {
    const userId = req.user.userId;

    try {
        // Ensure driver exists
        const driver = await User.findById(userId);
        if (!driver) return res.status(404).json({
            message: "Driver not found"
        });


        const currentDriverId = new mongoose.Types.ObjectId(userId);

        const [rides, reviewStats] = await Promise.all([
            Ride.find({
                driverId: { $ne: currentDriverId }
            })
                .sort({ createdAt: -1 })
                .populate("driverId")
                .populate("vehicleId"),
            Reviews.aggregate([
                {
                    $group: {
                        _id: "$userId",
                        averageRating: { $avg: "$star" },
                        totalReviews: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const ratingMap = new Map(
            reviewStats.map(r => [
                r._id.toString(),
                {
                    averageRating: Math.round((r.averageRating || 0) * 10) / 10,
                    totalReviews: r.totalReviews || 0,
                }
            ])
        );

        const data = rides.map(async (ride) => {
            const driverId = ride.driverId._id.toString();

            // Fetch bookings for this ride with user details
            const bookings = await BookRide.find({ rideId: ride._id })
                .populate("bookerId")
                .sort({ createdAt: -1 });

            return {
                ...ride.toObject(),
                driverReview: ratingMap.get(driverId) ?? {
                    averageRating: 0,
                    totalReviews: 0,
                },
                bookings: bookings.map(booking => ({
                    _id: booking._id,
                    bookerId: booking.bookerId,
                    pickup_address: booking.pickup_address,
                    drop_off_address: booking.drop_off_address,
                    seat: booking.seat,
                    accepted: booking.accepted,
                    bookStatus: booking.bookStatus,
                })),
            };
        });

        // Wait for all async operations to complete
        const ridesWithBookings = await Promise.all(data);

        return res.status(200).json({
            message: "Rides fetched successfully",
            data: ridesWithBookings,
        });

    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to fetch rides",
        });
    }
}
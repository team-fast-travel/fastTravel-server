/**
 * @swagger
 * /fetch_ride:
 *   get:
 *     summary: Fetch rides for authenticated driver
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
 *                         example: 25
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
 *                             example: 4.6
 *                           totalReviews:
 *                             type: number
 *                             example: 18
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

import { Ride } from "../../../models/ride/ride.js";
import { Reviews } from "../../../models/users/reviews.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchRidesByDriver = async (req: Request, res: Response) => {
    const driverId = req.user.userId;

    try {
        // Ensure driver exists
        const driver = await User.findById(driverId);
        if (!driver) return res.status(404).json({
            message: "Driver not found"
        });

        const [rides, reviewStats] = await Promise.all([
            Ride.find({ driverId })
                .sort({ createdAt: -1 })
                .populate("driverId")
                .populate("vehicleId"),
            Reviews.aggregate([
                { $match: { userId: driver._id } },
                {
                    $group: {
                        _id: "$userId",
                        averageRating: { $avg: "$star" },
                        totalReviews: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const ratingData = reviewStats[0] || {
            averageRating: 0,
            totalReviews: 0,
        };

        ratingData.averageRating = Math.round(ratingData.averageRating * 10) / 10;

        const data = rides.map((ride) => ({
            ...ride.toObject(),
            driverReview: ratingData,
        }));

        return res.status(200).json({
            message: "Rides fetched successfully",
            data,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to fetch rides for driver",
        });
    }
};

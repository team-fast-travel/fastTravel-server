/**
 * @swagger
 * /rides/search:
 *   get:
 *     summary: Search for rides
 *     description: Search rides by starting location (`from`) and destination (`to`). Only returns rides with status "Static". Also returns other rides created by each driver.
 *     tags:
 *       - Rides
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: from
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         example: Toronto
 *       - name: to
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         example: Ottawa
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       driverId:
 *                         $ref: '#/components/schemas/User'
 *                       vehicleId:
 *                         $ref: '#/components/schemas/Vehicle'
 *                       start_location:
 *                         type: string
 *                       drop_off:
 *                         type: string
 *                       final_end_location:
 *                         type: string
 *                       status:
 *                         type: string
 *                         example: Static
 *                       driverReview:
 *                         type: object
 *                         properties:
 *                           averageRating:
 *                             type: number
 *                           totalReviews:
 *                             type: number
 *                       otherRidesByDriver:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             start_location:
 *                               type: string
 *                             drop_off:
 *                               type: string
 *                             status:
 *                               type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Missing from or to
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

import type { Request, Response } from "express";
import { Ride } from "../../../models/ride/ride.js";
import { Reviews } from "../../../models/users/reviews.js";
import { BookRide } from "../../../models/ride/bookRide.js";
import { Preference } from "../../../models/users/preferences.js";
import { User } from "../../../models/users/user.js";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchRides = async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const fromRaw = (req.query.from as string) || "";
  const toRaw = (req.query.to as string) || "";

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const from = fromRaw.trim();
  const to = toRaw.trim();

  if (!from || !to) return res.status(400).json({ message: "From and To are required" });

  const fromRx = new RegExp(escapeRegExp(from), "i");
  const toRx = new RegExp(escapeRegExp(to), "i");

  try {
    const [rides, reviewStats, userPreferences, drivers] = await Promise.all([
      Ride.find({
        status: { $in: ["Static"] },
        $and: [
          // FROM matches the start
          { start_location: { $regex: fromRx } },

          // TO matches drop-off OR final
          {
            $or: [
              { drop_off: { $regex: toRx } },
              { final_end_location: { $regex: toRx } },
            ],
          },
        ],
      })
        .sort({ createdAt: -1 })
        .populate("driverId vehicleId"),
      Reviews.aggregate([
        {
          $group: {
            _id: "$userId",
            averageRating: { $avg: "$star" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      Preference.findOne({ userId }),
      User.find({})
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

    // Create a driver map for quick lookup
    const driverMap = new Map(drivers.map(d => [d._id.toString(), d]));

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

    // Sort rides based on user preferences
    let sortedRides = ridesWithBookings;
    if (userPreferences) {
      const matchingRides = [];
      const nonMatchingRides = [];

      for (const ride of ridesWithBookings) {
        const driver = driverMap.get(ride.driverId._id.toString());
        if (!driver) {
          nonMatchingRides.push(ride);
          continue;
        }

        let isMatch = true;

        // Check driver gender preference
        if (userPreferences.driverGender !== "both") {
          if (driver.gender?.toLowerCase() !== userPreferences.driverGender) {
            isMatch = false;
          }
        }

        // Check language preference
        if (isMatch && userPreferences.language && userPreferences.language.length > 0) {
          const driverLanguages = driver.languages || [];
          const hasMatchingLanguage = userPreferences.language.some(lang =>
            driverLanguages.includes(lang)
          );
          if (!hasMatchingLanguage) {
            isMatch = false;
          }
        }

        // Check car features preference
        if (isMatch && userPreferences.carFeatures && userPreferences.carFeatures.length > 0) {
          const vehicleFeatures = (ride.vehicleId && typeof ride.vehicleId === 'object') ? (ride.vehicleId as any).vehicleFeatures : [];
          const hasMatchingFeatures = userPreferences.carFeatures.some(feature =>
            (vehicleFeatures || []).includes(feature)
          );
          if (!hasMatchingFeatures) {
            isMatch = false;
          }
        }

        if (isMatch) {
          matchingRides.push(ride);
        } else {
          nonMatchingRides.push(ride);
        }
      }

      sortedRides = [...matchingRides, ...nonMatchingRides];
    }

    return res.status(200).json({
      message: "Rides fetched",
      data: sortedRides,
    });

  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to search rides",
    });
  }
};

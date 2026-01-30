/**
 * @swagger
 * /create_booking:
 *   post:
 *     summary: Create a booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rideId:
 *                 type: string
 *               pickup_address:
 *                 type: string
 *               drop_off_address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import { Ride } from "../../../models/ride/ride.js";
import { BookRide } from "../../../models/ride/bookRide.js";
import { Vehicle } from "../../../models/vehicle/vehicle.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyRequest {
    rideId: string;
    bookerId: string;
    pickup_address: string;
    drop_off_address: string;
    seat: {
        seatType: 'front' | 'middle' | 'back';
        indices: number[];
    };
}

export const createBooking = async (req: Request<{}, any, BodyRequest>, res: Response) => {
    const bookerId = req.user.userId;

    const {
        rideId,
        pickup_address,
        drop_off_address,
        seat,
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

        // Validate seat availability
        if (!seat || !seat.seatType || !Array.isArray(seat.indices)) {
            return res.status(400).json({
                message: "Seat information with indices is required"
            });
        }

        if (seat.indices.length === 0) {
            return res.status(400).json({
                message: "At least one seat index must be selected"
            });
        }

        // Validate that indices are unique
        if (new Set(seat.indices).size !== seat.indices.length) {
            return res.status(400).json({
                message: "Duplicate seat indices provided"
            });
        }

        // Validate that all indices are non-negative
        if (!seat.indices.every(idx => typeof idx === 'number' && idx >= 0)) {
            return res.status(400).json({
                message: "All seat indices must be non-negative numbers"
            });
        }

        // Get current booked seats for this ride and seat type
        const bookedSeatsOfType = ride.bookedSeats.filter(
            bs => bs.seatType === seat.seatType
        );
        const bookedIndices = bookedSeatsOfType.map(bs => bs.seatIndex);

        // Check if any requested seats are already booked
        const conflictingSeats = seat.indices.filter(idx => bookedIndices.includes(idx));
        if (conflictingSeats.length > 0) {
            return res.status(409).json({
                message: `Seats ${conflictingSeats.join(', ')} are already booked`
            });
        }

        // Validate seat limits based on available count
        if (seat.seatType === 'front') {
            if (seat.indices.length > 1) {
                return res.status(400).json({
                    message: "Only 1 front seat is available for passengers"
                });
            }
            // Check if index 0 (driver seat) is being selected
            if (seat.indices.includes(0)) {
                return res.status(400).json({
                    message: "Driver seat cannot be booked"
                });
            }
            if (ride.availableSeats.front < seat.indices.length) {
                return res.status(400).json({
                    message: "Not enough front seats available"
                });
            }
        } else if (seat.seatType === 'middle') {
            if (ride.availableSeats.middle < seat.indices.length) {
                return res.status(400).json({
                    message: "Not enough middle seats available"
                });
            }
        } else if (seat.seatType === 'back') {
            if (ride.availableSeats.back < seat.indices.length) {
                return res.status(400).json({
                    message: "Not enough back seats available"
                });
            }
        } else {
            return res.status(400).json({
                message: "Invalid seat type. Must be 'front', 'middle', or 'back'"
            });
        }

        // Create booking
        const bookRide = await BookRide.create({
            rideId,
            bookerId,
            pickup_address,
            drop_off_address,
            seat,
            bookStatus: "Under Review",
        });

        // Update available seats
        const updatedAvailableSeats = { ...ride.availableSeats };
        if (seat.seatType === 'front') {
            updatedAvailableSeats.front -= seat.indices.length;
        } else if (seat.seatType === 'middle') {
            updatedAvailableSeats.middle -= seat.indices.length;
        } else if (seat.seatType === 'back') {
            updatedAvailableSeats.back -= seat.indices.length;
        }

        // Add booked seat records
        const newBookedSeats = seat.indices.map(idx => ({
            seatType: seat.seatType,
            seatIndex: idx,
            bookingId: bookRide._id
        }));

        await Ride.findByIdAndUpdate(rideId, {
            availableSeats: updatedAvailableSeats,
            $push: { bookedSeats: { $each: newBookedSeats } }
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
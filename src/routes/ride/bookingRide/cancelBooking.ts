/**
 * @swagger
 * /cancel_booking/{bookId}:
 *   delete:
 *     summary: Cancel a booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       400:
 *         description: Bad request
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import type { BookEditParams } from "../../../interface/interface.js";
import { BookRide } from "../../../models/ride/bookRide.js";
import { Ride } from "../../../models/ride/ride.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const cancelBooking = async (req: Request<BookEditParams>, res: Response) => {
    const bookerId = req.user.userId;
    const { bookId } = req.params;

    try {
        // Ensure user exists
        const rider = await User.findById(bookerId);
        if (!rider) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        // Ensure bookRide exist
        const bookRide = await BookRide.findById(bookId);
        if (!bookRide) {
            return res.status(404).json({
                message: "Booking not found"
            })
        };

        await BookRide.findByIdAndDelete(bookId);

        // Restore seats to the ride
        const ride = await Ride.findById(bookRide.rideId);
        if (ride) {
            const updatedAvailableSeats = { ...ride.availableSeats };
            if (bookRide.seat.seatType === 'front') {
                updatedAvailableSeats.front += bookRide.seat.indices.length;
            } else if (bookRide.seat.seatType === 'middle') {
                updatedAvailableSeats.middle += bookRide.seat.indices.length;
            } else if (bookRide.seat.seatType === 'back') {
                updatedAvailableSeats.back += bookRide.seat.indices.length;
            }

            // Remove booked seat records for this booking
            await Ride.findByIdAndUpdate(bookRide.rideId, {
                availableSeats: updatedAvailableSeats,
                $pull: { bookedSeats: { bookingId: bookId } }
            });
        }

        // Emit socket
        const io = getSocket();
        io?.to(bookerId.toString()).emit("booking_canceled", bookRide);

        return res.status(200).json({
            message: "Ride canceled successfully",
            data: bookRide,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to cancel ride",
        });
    }
}
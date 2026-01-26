/**
 * @swagger
 * /edit_booking/{bookId}:
 *   put:
 *     summary: Edit a booking by booker
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pickup_address:
 *                 type: string
 *               drop_off_address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking updated
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
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const editBookingByRider = async (req: Request<BookEditParams>, res: Response) => {
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

        if (bookRide.bookerId.toString() !== bookerId.toString()) {
            return res
                .status(403)
                .json({ message: "You cannot edit someone else's ride" });
        };

        // Selectively update provided fields
        Object.assign(bookRide, req.body);

        // Emit socket
        const io = getSocket();
        io?.to(bookerId.toString()).emit("booking_updated", bookRide);

        return res.status(200).json({
            message: "Ride updated successfully",
            data: bookRide,
        });

    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to update ride",
        });
    }
}
import { getSocket } from "../../../config/connection.js";
import type { BookEditParams } from "../../../interface/interface.js";
import { BookRide } from "../../../models/ride/bookRide.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const cancelBooking = async (req: Request<BookEditParams>, res: Response) => {
    const bookerId = req.user.id;
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
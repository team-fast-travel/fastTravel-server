import { getSocket } from "../../../config/connection.js";
import { Reviews } from "../../../models/users/reviews.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

/**
 * @swagger
 * /create_review:
 *   post:
 *     summary: Create a review for a user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               star:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */

interface ReviewBody {
    userId: string;
    star: number;
    comment: string;
}

export const createReview = async (req: Request<{}, any, ReviewBody>, res: Response) => {
    const reviewerId = req.user.id;
    const { userId, star, comment } = req.body;

    // Ensure user and star is submitted
    if (!userId || !star) {
        return res.status(400).json({
            message: "userId and star are required",
        });
    }

    // Ensure reviewer cannot review themselve
    if (reviewerId === userId) {
        return res.status(400).json({
            message: "You cannot review yourself"
        });
    }

    // Ensure star value must be between 1 and 5
    if (star < 1 || star > 5) {
        return res
            .status(400)
            .json({ message: "star must be between 1 and 5" });
    }

    try {
        // Ensure users exist
        const [reviewer, reviewedUser] = await Promise.all([
            User.findById(reviewerId),
            User.findById(userId),
        ]);

        if (!reviewer || !reviewedUser) {
            return res.status(404).json({
                message: "Reviewer or reviewed user not found",
            });
        }

        const review = await Reviews.create({
            userId,
            reviewerId,
            star,
            comment: comment ?? "",
        });

        // Emit socket
        const io = getSocket();
        io?.to('fastTravel_global_room').emit('new_review', review);

        return res.status(201).json({
            message: "Review submitted successfully",
            data: review,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to submit review",
        });
    }
};

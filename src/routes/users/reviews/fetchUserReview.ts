/**
 * @swagger
 * /fetch_user_review/{userId}:
 *   get:
 *     summary: Fetch reviews for a user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User reviews
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
import type { ReviewEditParams } from "../../../interface/interface.js";
import { Reviews } from "../../../models/users/reviews.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchUserReviews = async (req: Request<ReviewEditParams>, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({
            message: "userId is required",
        });
    }

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const reviews = await Reviews.find({ userId })
            .populate("userId").populate("reviewerId")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Reviews fetched successfully",
            data: reviews,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to fetch user reviews",
        });
    }
};

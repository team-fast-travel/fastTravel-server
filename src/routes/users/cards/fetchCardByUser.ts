/**
 * @swagger
 * /fetch_card:
 *   get:
 *     summary: Fetch payment cards for authenticated user
 *     tags: [Card]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cards
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { Card } from "../../../models/users/cards.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchCardByUser = async (req: Request, res: Response) => {
    const userId = req.user.id;

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const cards = await Card.find({ userId }).sort({
            createdAt: -1,
        }).populate("userId") || [];

        return res.status(200).json({
            message: "Cards fetched successfully",
            data: cards,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to fetch cards",
        });
    }
};

/**
 * @swagger
 * /create_card:
 *   post:
 *     summary: Create a payment card for user
 *     tags: [Card]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               card_no:
 *                 type: string
 *     responses:
 *       201:
 *         description: Card created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import { Card } from "../../../models/users/cards.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface CardBody {
    card_no: string;
    card_cvv: string;
    card_date: string;
    card_first_name: string;
    card_last_name: string;
}

export const createCard = async (req: Request<{}, any, CardBody>, res: Response) => {
    const userId = req.user.userId;
    const { card_no, card_cvv, card_date, card_first_name, card_last_name } = req.body;

    if (!card_no || !card_cvv || !card_date || !card_first_name || !card_last_name) {
        return res.status(400).json({ message: "All Card fields are required" });
    }

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const newCard = await Card.create({
            userId,
            card_no,
            card_cvv,
            card_date,
            card_first_name,
            card_last_name,
        });

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("new_card", newCard);

        return res.status(201).json({
            message: "Card created successfully",
            data: newCard,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to create Card",
        });
    }
};

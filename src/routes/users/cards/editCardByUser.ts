/**
 * @swagger
 * /edit_card/{cardId}:
 *   put:
 *     summary: Edit a payment card
 *     tags: [Card]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *         description: The card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Card updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import type { CardEditParams } from "../../../interface/interface.js";
import { Card } from "../../../models/users/cards.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const editCardByUser = async (req: Request<CardEditParams>, res: Response) => {
    const userId = req.user.userId;
    const { cardId } = req.params;

    if (!cardId) {
        return res.status(400).json({
            messgae: "Card ID is required"
        })
    }

    try {
        // Ensure rider exist
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        // Ensure Card exist
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: "Card not found" });

        // Ensure user owns Card
        if (card.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        Object.assign(Card, req.body);
        await card.save();

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("card_updated", card);

        return res.status(200).json({
            message: "Card updated successfully",
            data: card
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to update Card",
        });
    }
};

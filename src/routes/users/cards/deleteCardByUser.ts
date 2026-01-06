/**
 * @swagger
 * /delete_card/{cardId}:
 *   delete:
 *     summary: Delete a payment card
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
 *     responses:
 *       200:
 *         description: Card deleted
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

export const deleteCardByUser = async (req: Request<CardEditParams>, res: Response) => {
    const userId = req.user.id;
    const { cardId } = req.params;

    if(!cardId) {
        return res.status(400).json({
            messgae: "Card ID is required"
        })
    }

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        // Ensure Card exists
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: "Card not found" });

        if (card.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Card.findByIdAndDelete(cardId);

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("card_deleted", card);

        return res.status(200).json({
            message: "Card deleted successfully",
            data: card,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to delete card",
        });
    }
};

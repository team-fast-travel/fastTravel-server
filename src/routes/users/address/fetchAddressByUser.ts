/**
 * @swagger
 * /fetch_address:
 *   get:
 *     summary: Fetch addresses for authenticated user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User addresses
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { Address } from "../../../models/users/address.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchAddressByUser = async (req: Request, res: Response) => {
    const userId = req.user.userId;

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const addresses = await Address.find({ userId }).sort({
            createdAt: -1,
        }).populate("userId") || [];

        return res.status(200).json({
            message: "Addresses fetched successfully",
            data: addresses,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to fetch addresses",
        });
    }
};

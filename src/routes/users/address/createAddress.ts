/**
 * @swagger
 * /create_address:
 *   post:
 *     summary: Create a new address for user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               address:
 *                 type: string
 *               province:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       201:
 *         description: Address created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import { Address } from "../../../models/users/address.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface AddressBody {
    title: string;
    address: string;
    province: string;
    city: string;
    postal_code: string;
}

export const createAddress = async (req: Request<{}, any, AddressBody>, res: Response) => {
    const userId = req.user.id;
    const { title, address, province, city, postal_code } = req.body;

    if (!title || !address || !province || !city || !postal_code) {
        return res.status(400).json({ message: "All address fields are required" });
    }

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const newAddress = await Address.create({
            userId,
            title,
            address,
            province,
            city,
            postal_code,
        });

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("new_address", newAddress);

        return res.status(201).json({
            message: "Address created successfully",
            data: newAddress,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to create address",
        });
    }
};

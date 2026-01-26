/**
 * @swagger
 * /preferences/{userId}:
 *   get:
 *     summary: Get a user's preference
 *     description: Fetches the ride preference of a given user by their userId.
 *     tags:
 *       - Preferences
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the user
 *         example: 63f1b2e4a1b2c3d4e5f6g7h
 *     responses:
 *       200:
 *         description: Preference retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preference:
 *                   $ref: '#/components/schemas/Preference'
 *       400:
 *         description: Missing user ID
 *       404:
 *         description: Preference not found
 *       500:
 *         description: Server error
 */


import { Preference } from "../../../models/users/preferences.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchUserPreference = async (req: Request, res: Response) => {
    const userId = req.user.userId;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }
    try {
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const preference = await Preference.findOne({ userId });
        if (!preference) {
            return res.status(404).json({ error: "Preference not found for this user" });
        }

        return res.status(200).json({ message: "Preference fetched successfully", data: preference });
    } catch (err) {
        console.error("Error fetching user preference:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

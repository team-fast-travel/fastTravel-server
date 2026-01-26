/**
 * @swagger
 * /create_preference:
 *   post:
 *     summary: Create or update a user preference
 *     description: Creates a new preference for a user, or updates it if one already exists.
 *     tags:
 *       - Preferences
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: MongoDB ID of the user
 *                 example: 63f1b2e4a1b2c3d4e5f6g7h
 *               driverGender:
 *                 type: string
 *                 enum: [male, female, both, non-binary]
 *                 description: Preferred driver gender
 *                 example: both
 *               language:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [English, French, Punjabi, Mandarin, Arabic, Cantonese, Spanish, Tagalog, Italian, German, Urdu, Portuguese, Hindi, Vietnamese, Persian]
 *                 description: User preferred languages
 *                 example: ["English", "Mandarin"]
 *               carFeatures:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Air Conditioning, Heated Seats, Bluetooth, Sunroof, Leather Seats, USB Charging, Wi-Fi, Pet Friendly, Child Seat, Music System]
 *                 description: Preferred car features
 *                 example: ["Air Conditioning", "Bluetooth"]
 *     responses:
 *       200:
 *         description: Preference created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 preference:
 *                   $ref: '#/components/schemas/Preference'
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */


import { Preference, type CarFeature, type TopLanguages } from "../../../models/users/preferences.js";
import { getSocket } from "../../../config/connection.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface CreatePreference {
    userId: string;
    driverGender?: "male" | "female" | "both" | "non-binary";
    language?: TopLanguages[];
    carFeatures?: CarFeature[];
}

export const createPreference = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const { driverGender, language, carFeatures } = req.body as CreatePreference;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Find existing preference
        let preference = await Preference.findOne({ userId });

        if (preference) {
            // Update existing preference
            preference.driverGender = driverGender ?? preference.driverGender;
            preference.language = language ?? preference.language;
            preference.carFeatures = carFeatures ?? preference.carFeatures;

            await preference.save();
        } else {
            // Create new preference
            preference = new Preference({
                userId,
                driverGender,
                language,
                carFeatures,
            });
            await preference.save();
        }

        // Emit an update event via socket
        const io = getSocket();
        io?.to(userId).emit("preference_updated", preference);

        return res.status(200).json({ message: "Preference updated successfully", data: preference });
    } catch (err) {
        console.error("Error creating/updating preference:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

/**
 * @swagger
 * /fetch_user_notification:
 *   get:
 *     summary: Fetch notifications for authenticated user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User notifications
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { Notification } from "../../../models/users/notification.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchUserNotification = async (req: Request, res: Response) => {
    const userId = req.user.id;

    try {
        // Ensure user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const notifications = await Notification.find({ userId }).sort({
            createdAt: -1,
        }).populate("userId");

        return res.status(200).json({
            message: "Notifications fetched successfully",
            data: notifications,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch notifications",
        });
    }
};

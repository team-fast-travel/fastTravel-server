/**
 * @swagger
 * /mark_all_notification_read:
 *   put:
 *     summary: Mark all user notifications as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked read
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { Notification } from "../../../models/users/notification.js";
import { getSocket } from "../../../config/connection.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
    const userId = req.user.id;

    try {
        // Ensure user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        await Notification.updateMany(
            { userId, is_read: false },
            {
                $set: {
                    is_read: true,
                    read_at: new Date().toISOString(),
                },
            }
        );

        return res.status(200).json({
            message: "All notifications marked as read",
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to mark notifications as read",
        });
    }
};

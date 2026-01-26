/**
 * @swagger
 * /mark_notification_read/{notificationId}:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The notification ID
 *     responses:
 *       200:
 *         description: Notification marked read
 *       400:
 *         description: Bad request
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
import { Notification } from "../../../models/users/notification.js";
import { getSocket } from "../../../config/connection.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";
import type { NotificationEditParams } from "../../../interface/interface.js";

export const markNotificationRead = async (req: Request<NotificationEditParams>, res: Response) => {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    try {
        // Ensure user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        // Ensure notification exist before marking as read
        const notification = await Notification.findById(notificationId);

        if (!notification)
            return res.status(404).json({ message: "Notification not found" });

        if (notification.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        notification.is_read = true;
        notification.read_at = new Date().toISOString();

        await notification.save();

        const io = getSocket();
        io?.to(userId).emit("notification_read", notification);

        return res.status(200).json({
            message: "Notification marked as read",
            data: notification,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to mark notification as read",
        });
    }
};

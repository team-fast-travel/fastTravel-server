import { Notification } from "../../../models/users/notification.js";
import { getSocket } from "../../../config/connection.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";
import type { NotificationEditParams } from "../../../interface/interface.js";

export const deleteUserNotification = async (req: Request<NotificationEditParams>, res: Response) => {
    const userId = req.user.id;
    const { notificationId } = req.params;

    try {
        // Ensure user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const notification = await Notification.findById(notificationId);

        if (!notification)
            return res.status(404).json({ message: "Notification not found" });

        if (notification.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Notification.findByIdAndDelete(notificationId);

        const io = getSocket();
        io?.to(userId).emit("delete_notification", notification);

        return res.status(200).json({
            message: "Notification deleted successfully",
            notificationId,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to delete notification",
        });
    }
};

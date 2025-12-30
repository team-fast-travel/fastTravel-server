import { Notification } from "../../../models/users/notification.js";
import { getSocket } from "../../../config/connection.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface CreateNotificationBody {
    userId: string;
    notification_type: "GENERAL" | "RIDE_UPDATE" | "PAYMENT" | "CHAT" | "SYSTEM";
    title: string;
    message: string;
    data?: Record<string, any>;
}

export const createNotification = async (req: Request<{}, any, CreateNotificationBody>, res: Response) => {
    const { userId, notification_type, title, message, data } = req.body;

    if (!userId || !notification_type || !title || !message) {
        return res
            .status(400)
            .json({ message: "userId, notification_type, title, and message required" });
    }

    try {
        // Ensure user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const notification = await Notification.create({
            userId,
            notification_type,
            title,
            message,
            data: data ?? {},
        });

        const io = getSocket();
        io?.to(userId).emit("new_notification", notification);

        return res.status(201).json({
            message: "Notification created successfully",
            data: notification,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to create notification",
        });
    }
};

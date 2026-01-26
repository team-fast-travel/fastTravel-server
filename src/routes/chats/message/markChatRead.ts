import mongoose from "mongoose";
import { Chat } from "../../../models/chats/chat.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const markChatRead = async (req: Request, res: Response) => {
    const senderId = req.user?.userId;
    const { receiverId } = req.params;

    if (!senderId) return res.status(401).json({ message: "Unauthorized" });
    if (!receiverId) return res.status(400).json({ message: "userId is required" });

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ message: "Invalid userId" });
    }

    try {
        // Ensure user exist
        const user = await User.findById(senderId).select("_id");
        if (!user) {
            return res.status(400).json({
                message: 'User doesnt exist'
            })
        }
        const otherUser = await User.findById(receiverId).select("_id");
        if (!otherUser) return res.status(404).json({ message: "Other user not found" });

        const meId = new mongoose.Types.ObjectId(senderId);
        const otherId = new mongoose.Types.ObjectId(receiverId);

        // Mark all unread messages FROM other user TO me as seen
        const result = await Chat.updateMany(
            {
                sender: otherId,
                receiver: meId,
                seen: false,
            },
            {
                $set: {
                    seen: true,
                    seen_at: new Date().toISOString(),
                },
            }
        );

        return res.status(200).json({
            message: "Chat marked as read",
            data: result,
        });

    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to mark chat read",
        });
    }
}
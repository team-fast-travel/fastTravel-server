import type { MsgFetchParams } from "../../../interface/interface.js";
import { Chat } from "../../../models/chats/chat.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchMsgBtwSenders = async (req: Request<MsgFetchParams>, res: Response) => {
    const { senderId, receiverId } = req.params;
    if (!senderId || !receiverId) {
        return res.status(400).json({ message: "senderId and receiverId are required" });
    }

    try {
        // ensure both users exist
        const [senderUser, receiverUser] = await Promise.all([
            User.findById(senderId),
            User.findById(receiverId),
        ]);

        if (!senderUser || !receiverUser) {
            return res.status(404).json({
                message: "Sender or receiver not found",
            });
        };

        const messages = await Chat.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        })
            .sort({ createdAt: 1 })
            .populate("sender")
            .populate("receiver") || [];

        return res.status(200).json({
            message: 'Messages fetched successfully',
            data: messages
        });

    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to send message",
        });
    }
}
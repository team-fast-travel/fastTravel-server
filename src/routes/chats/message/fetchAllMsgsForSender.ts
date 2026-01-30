/**
 * @swagger
 * /chats/list:
 *   get:
 *     tags: [Chat]
 *     summary: Get chat list (WhatsApp-style)
 *     description: |
 *       Returns a WhatsApp-style chat list for the authenticated user:
 *       - one entry per conversation partner
 *       - includes the latest message for that conversation
 *       - sorted by latest message time desc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 30
 *         description: Page size (max 100)
 *     responses:
 *       200:
 *         description: Chat list fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chat list fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       conversationWith:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           fullName: { type: string }
 *                           username: { type: string }
 *                           picture: { type: string }
 *                       lastMessage:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           sender: { type: string }
 *                           receiver: { type: string }
 *                           messageType: { type: string, example: Text }
 *                           message: { type: string }
 *                           fileUrl: { type: string }
 *                           createdAt: { type: string, format: date-time }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer, example: 1 }
 *                     limit: { type: integer, example: 30 }
 *                     count: { type: integer, example: 10 }
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

import mongoose from "mongoose";
import { Chat } from "../../../models/chats/chat.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchAllMsgsForSender = async (req: Request, res: Response) => {
    const senderId = req.user?.userId;
    if (!senderId) return res.status(401).json({ message: "Unauthorized" });

    try {
        // Ensure user exist
        const user = await User.findById(senderId);
        if (!user) {
            return res.status(400).json({
                message: 'User doesnt exist'
            })
        }

        const meId = new mongoose.Types.ObjectId(senderId);

        const chatList = await Chat.aggregate([
            {
                $match: {
                    $or: [{ sender: meId }, { receiver: meId }],
                },
            },
            {
                $addFields: {
                    otherUser: {
                        $cond: [{ $eq: ["$sender", meId] }, "$receiver", "$sender"],
                    },
                    createdAtDate: { $toDate: "$created_at" },
                },
            },
            { $sort: { createdAtDate: -1 } },
            {
                $group: {
                    _id: "$otherUser", // one row per contact
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiver", meId] },
                                        { $eq: ["$seen", false] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            { $sort: { "lastMessage.createdAtDate": -1 } },

            // conversationWith (the contact)
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "contact",
                },
            },
            { $unwind: { path: "$contact", preserveNullAndEmptyArrays: true } },

            {
                $project: {
                    _id: 0,
                    conversationWith: {
                        _id: "$contact._id",
                        firstName: "$contact.firstName",
                        lastName: "$contact.lastName",
                    },
                    lastMessage: {
                        _id: "$lastMessage._id",
                        sender: "$lastMessage.sender",
                        receiver: "$lastMessage.receiver",
                        messageType: "$lastMessage.messageType",
                        message: "$lastMessage.message",
                        fileUrl: "$lastMessage.fileUrl",
                        created_at: "$lastMessage.created_at",
                        seen: "$lastMessage.seen",
                    },
                    unreadCount: 1,
                },
            },
        ]);

        return res.status(200).json({
            message: "Chat list fetched successfully",
            data: chatList,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to fetch chat list",
        });
    }
};

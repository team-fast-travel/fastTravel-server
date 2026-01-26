/**
 * @swagger
 * /delete_msg/{messageId}/{otherUserId}:
 *   delete:
 *     summary: Delete a message between two users
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The message ID
 *       - in: path
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: The other user ID
 *     responses:
 *       200:
 *         description: Message deleted
 *       400:
 *         description: Bad request
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import type { MsgDeleteParams } from "../../../interface/interface.js";
import { Chat } from "../../../models/chats/chat.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const deleteMsgBtwSenders = async (req: Request<MsgDeleteParams>, res: Response) => {
    const { messageId, otherUserId } = req.params;
    const senderId = req.user.userId;

    if (!messageId || !otherUserId) {
        return res.status(400).json({
            message: "messageId and otherUserId are required",
        });
    };

    try {
        // Check if senderExist
        const userExist = await User.findById(senderId);
        if (!userExist) {
            return res.status(404).json({
                message: "User doesn't exist"
            })
        }

        // Delete message
        const message = await Chat.findOneAndDelete({
            _id: messageId,
            $or: [
                { sender: senderId, receiver: otherUserId },
                { sender: otherUserId, receiver: senderId },
            ]
        });

        if (!message) {
            return res.status(404).json({
                message: "Message not found or not authorized"
            });
        };

        // Notify room
        const chatRoom = [senderId, otherUserId].sort().join("_");
        const io = getSocket();
        if (io) {
            io.to(`chat_${chatRoom}`).emit("message_deleted", {
                messageId,
                deletedBy: senderId,
            });
        }

        return res.status(200).json({
            message: "Message deleted successfully",
            data: message,
        })
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error"
        });
    }
}
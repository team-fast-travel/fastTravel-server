/**
 * @swagger
 * /create_msg:
 *   post:
 *     summary: Create a one-to-one message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiver:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import { Chat } from "../../../models/chats/chat.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyRequest {
  receiver: string;
  messageType: "Text" | "Image" | "File";
  message?: string;
  fileUrl?: string;
}

// Request<Params, ResBody, ReqBody>
export const createMsg = async (req: Request<{}, any, BodyRequest>, res: Response) => {
  const sender = req.user.userId;
  const { receiver, messageType, message, fileUrl } = req.body;

  if (!receiver || !messageType) {
    return res.status(400).json({
      message: "receiver and messageType are required",
    });
  }

  // conditional validation
  if (messageType === "Text" && !message) {
    return res.status(400).json({
      message: "message is required for Text messages",
    });
  }

  if (messageType !== "Text" && !fileUrl) {
    return res.status(400).json({
      message: "fileUrl is required for Image/File messages",
    });
  }

  try {
    // ensure both users exist
    const [senderUser, receiverUser] = await Promise.all([
      User.findById(sender),
      User.findById(receiver),
    ]);

    if (!senderUser || !receiverUser) {
      return res.status(404).json({
        message: "Sender or receiver not found",
      });
    };

    // create chat document
    const chat = await Chat.create({
      sender,
      receiver,
      messageType,
      message: message ?? "",
      fileUrl: fileUrl ?? "",
    });

    // generate room id
    const chatRoom = [sender.toString(), receiver.toString()]
      .sort()
      .join("_");

    const io = getSocket();
    if (io) {
      io.to(`chat_${chatRoom}`).emit("new_message", chat);
    }

    return res.status(201).json({
      message: "Message sent successfully",
      data: chat,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send message",
    });
  }
};

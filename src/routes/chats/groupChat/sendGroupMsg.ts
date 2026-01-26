/**
 * @swagger
 * /send_group_msg:
 *   post:
 *     summary: Send a message to a group
 *     tags: [GroupChat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group message sent
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import { GroupChat } from "../../../models/chats/groupChat.js";
import { Group } from "../../../models/chats/group.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyRequest {
  groupId: string;
  messageType: "Text" | "Image" | "File";
  message?: string;
  fileUrl?: string;
}

export const sendGroupMsg = async (req: Request<{}, any, BodyRequest>, res: Response) => {
  const sender = req.user.userId;
  const { groupId, messageType, message, fileUrl } = req.body;

  if (!groupId || !messageType) {
    return res.status(400).json({
      message: "groupId and messageType are required",
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
    // ensure user exists
    const user = await User.findById(sender);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ensure group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // verify membership
    const isMember = group.members.some(
      (m) => m.user.toString() === sender.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this group",
      });
    }

    // create message in GroupChat
    const chat = await GroupChat.create({
      groupId,
      sender,
      messageType,
      message: message ?? "",
      fileUrl: fileUrl ?? "",
      seenBy: [sender],
    });

    // emit socket
    const io = getSocket();
    if (io) {
      io.to(`group_${groupId}`).emit("group_message", chat);
    }

    return res.status(201).json({
      message: "Message sent successfully",
      data: chat,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send group message",
    });
  }
};

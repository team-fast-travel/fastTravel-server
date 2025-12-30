import { GroupChat } from "../../../models/chats/groupChat.js";
import { Group } from "../../../models/chats/group.js";
import type { Request, Response } from "express";
import { getSocket } from "../../../config/connection.js";
import type { GrpDeleteParams } from "../../../interface/interface.js";

export const deleteGroupMsg = async (req: Request<GrpDeleteParams>, res: Response) => {
    const userId = req.user.id;
    const { messageId, groupId } = req.params;

    if (!messageId || !groupId) {
        return res
            .status(400)
            .json({ message: "messageId and groupId are required" });
    }

    try {
        // find group
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // verify user is a member
        const isMember = group.members.some(
            (m) => m.user.toString() === userId.toString()
        );
        if (!isMember) {
            return res
                .status(403)
                .json({ message: "You are not a member of this group" });
        }

        // find message
        const message = await GroupChat.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // permission check
        const isSender =
            message.sender.toString() === userId.toString();

        const isAdmin = group.admins.some(
            (a) => a.toString() === userId.toString()
        );

        if (!isSender && !isAdmin) {
            return res.status(403).json({
                message: "You are not allowed to delete this message",
            });
        }

        // delete the message
        await GroupChat.findByIdAndDelete(messageId);

        // emit socket
        const io = getSocket();
        if (io) {
            io.to(`group_${groupId}`).emit("group_message_deleted", {
                messageId,
                deletedBy: userId,
            });
        }

        return res.status(200).json({
            message: "Message deleted successfully",
            deletedMessageId: messageId,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to delete group message",
        });
    }
};

import { GroupChat } from "../../../models/chats/groupChat.js";
import { Group } from "../../../models/chats/group.js";
import type { Request, Response } from "express";
import type { GrpFetchParams } from "../../../interface/interface.js";

export const fetchGroupMsg = async (req: Request<GrpFetchParams>, res: Response) => {
    const { groupId } = req.params;
    if (!groupId) {
        return res.status(400).json({
            message: 'Group ID is required'
        })
    }

    try {
        // ensure group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Fetch group messages
        const messages = await GroupChat.find({ groupId: groupId })
            .populate("groupId")
            .populate("sender") || [];

        return res.status(200).json({
            message: "Group chat messaged fetched successfully",
            data: messages
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to send message",
        });
    }
}
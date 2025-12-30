import { Group } from "../../../models/chats/group.js";
import { getSocket } from "../../../config/connection.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";
import type { GrpFetchParams } from "../../../interface/interface.js";

export const addMemberToGroup = async (req: Request, res: Response) => {
    const adminId = req.user.id;
    const { groupId, userIdToAdd } = req.body;

    if (!groupId || !userIdToAdd) {
        return res
            .status(400)
            .json({ message: "groupId and userIdToAdd are required" });
    }

    try {
        // Ensure group exist
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Ensure adder is admin
        const isAdmin = group.admins.some(
            (a) => a.toString() === adminId.toString()
        );
        if (!isAdmin) {
            return res
                .status(403)
                .json({ message: "Only admins can add members" });
        }

        // Ensure user exists
        const user = await User.findById(userIdToAdd);
        if (!user) {
            return res.status(404).json({ message: "User to add not found" });
        }

        const alreadyMember = group.members.some(
            (m) => m.user.toString() === userIdToAdd.toString()
        );

        if (alreadyMember) {
            return res
                .status(409)
                .json({ message: "User is already a member of this group" });
        }

        group.members.push({
            user: userIdToAdd,
            joined_at: new Date().toISOString(),
        });

        await group.save();

        // emit socket
        const io = getSocket();
        if (io) {
            io.to(`group_${groupId}`).emit("group_member_added", group);
        }

        return res.status(200).json({
            message: "Member added successfully",
            data: group,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to add member",
        });
    }
};

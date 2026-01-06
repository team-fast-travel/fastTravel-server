/**
 * @swagger
 * /leave_grp/{groupId}:
 *   put:
 *     summary: Leave a group
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID
 *     responses:
 *       200:
 *         description: Left group
 *       400:
 *         description: Bad request
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
import { Group } from "../../../models/chats/group.js";
import { getSocket } from "../../../config/connection.js";
import type { Request, Response } from "express";
import type { GrpFetchParams } from "../../../interface/interface.js";

export const leaveGroup = async (req: Request<GrpFetchParams>, res: Response) => {
    const userId = req.user.id;
    const { groupId } = req.params;

    try {
        // Ensure group exist
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Ensure member is part of the group
        const isMember = group.members.some(
            (m) => m.user.toString() === userId.toString()
        );

        if (!isMember) {
            return res
                .status(403)
                .json({ message: "You are not a member of this group" });
        }

        group.members = group.members.filter(
            (m) => m.user.toString() !== userId.toString()
        );

        // also remove from admins list if present
        group.admins = group.admins.filter(
            (a) => a.toString() !== userId.toString()
        );

        await group.save();

        // emit socket
        const io = getSocket();
        if (io) {
            io.to(`group_${groupId}`).emit("group_member_left", group);
        }

        return res.status(200).json({
            message: "Left group successfully",
            data: group,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to leave group",
        });
    }
};

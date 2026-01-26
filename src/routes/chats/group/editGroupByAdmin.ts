/**
 * @swagger
 * /edit_grp/{groupId}:
 *   put:
 *     summary: Edit a group by admin
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Group updated
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

interface RequestParams {
    groupId: string;
}

interface BodyRequest {
    groupName: string;
    bio: string;
}

export const editGroupByAdmin = async (req: Request<GrpFetchParams, any, BodyRequest>, res: Response) => {
    const adminId = req.user.userId;
    const { groupId } = req.params;
    const { groupName, bio } = req.body;

    try {
        // Ensure group exist
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Ensure admin exist
        const isAdmin = group.admins.some(
            (a) => a.toString() === adminId.toString()
        );
        if (!isAdmin) {
            return res
                .status(403)
                .json({ message: "Only admins can edit group" });
        }

        if (groupName) group.groupName = groupName;
        if (bio) group.bio = bio;

        await group.save();

        // emit socket
        const io = getSocket();
        if (io) {
            io.to(`group_${groupId}`).emit("group_edited", group);
        }

        return res.status(200).json({
            message: "Group updated successfully",
            data: group,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to update group",
        });
    }
};

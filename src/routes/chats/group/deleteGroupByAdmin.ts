/**
 * @swagger
 * /del_grp/{groupId}:
 *   delete:
 *     summary: Delete a group by admin
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
 *         description: Group deleted
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

export const deleteGroupByAdmin = async (req: Request<GrpFetchParams>, res: Response) => {
    const adminId = req.user.userId;
    const { groupId } = req.params;

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
                .json({ message: "Only admins can delete group" });
        }

        await Group.findByIdAndDelete(groupId);

        // emit socket
        const io = getSocket();
        if (io) {
            io.to(`group_${groupId}`).emit("group_deleted", group);
        }

        return res.status(200).json({
            message: "Group deleted successfully",
            data: group
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to delete group",
        });
    }
};

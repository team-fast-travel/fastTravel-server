/**
 * @swagger
 * /create_group:
 *   post:
 *     summary: Create a chat group
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupName:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { Group } from "../../../models/chats/group.js";
import { User } from "../../../models/users/user.js";
import { getSocket } from "../../../config/connection.js";
import type { Request, Response } from "express";

interface BodyRequest {
    groupName: string;
    bio: string;
}

export const createGroup = async (req: Request<{}, any, BodyRequest>, res: Response) => {
    const userId = req.user.userId;
    const { groupName, bio } = req.body;

    if (!groupName || !bio) {
        return res.status(400).json({ message: "groupName and bio are required" });
    }

    try {
        // Ensure user exist
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Create group document
        const group = await Group.create({
            groupName,
            bio,
            admins: [userId],
            members: [
                {
                    user: userId,
                    joined_at: new Date().toISOString(),
                },
            ],
        });

        // emit socket
        const io = getSocket();
        if (io) {
            io.to(`fastTravel_global_room`).emit("new_group_created", group);
        }
        return res.status(201).json({
            message: "Group created successfully",
            data: group,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to create group",
        });
    }
};

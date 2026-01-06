/**
 * @openapi
 * /delete_user:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted
 */
import { getSocket } from "../../../config/connection.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const deleteUser = async (req: Request, res: Response) => {
    const userId = req.user.id;
    try {
        // Ensure user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        await User.findByIdAndDelete(user);

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("user_deleted");

        return res.status(200).json({
            message: "User deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error
                ? error.message
                : "Failed to delete user.",
        });
    }
}

/**
 * @openapi
 * /fetch_user/{userId}:
 *   get:
 *     tags:
 *       - User
 *     summary: Fetch a user's public profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 */
import type { UserEditParams } from "../../../interface/interface.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const fetchUser = async (req: Request<UserEditParams>, res: Response) => {
    const { userId } = req.params;

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        return res.status(200).json({
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to fetch User",
        });
    }
};

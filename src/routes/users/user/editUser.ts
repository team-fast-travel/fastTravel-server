/**
 * @openapi
 * /edit_user:
 *   put:
 *     tags:
 *       - User
 *     summary: Edit authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated
 */
import { getSocket } from "../../../config/connection.js";
import { hashPwd } from "../../../middleware/comparePwd.js";
import { generateToken } from "../../../middleware/generateToken.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyParam {
    firstName: string;
    lastName: string;
    gender: string;
    email: string;
    phone: string;
    password: string;
    province: string;
    city: string;
}

export const editUser = async (req: Request<{}, any, BodyParam>, res: Response) => {
    const userId = req.user.id;
    try {

        // Ensure user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };
    
        if (req.body.password) req.body.password = await hashPwd(req.body.password);
        Object.assign(user, req.body);
        await user.save();

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("user_updated", user);

        return res.status(200).json({
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error
                ? error.message
                : "Failed to update user.",
        });
    }
}

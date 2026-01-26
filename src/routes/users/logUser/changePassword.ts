/**
 * @swagger
 * /users/change_password:
 *   put:
 *     summary: Change user password
 *     description: Change the authenticated user's password by validating the old password.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - password
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: OldPassword123!
 *                 description: User's current password
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: NewStrongPassword123!
 *                 description: New password to set
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid old password
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

import { comparePwd, hashPwd } from "../../../middleware/comparePwd.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyParam {
    oldPassword: string
    password: string;
}

export const changePassword = async (req: Request<{}, any, BodyParam>, res: Response) => {
    const userId = req.user.userId;
    const { oldPassword, password } = req.body;

    if (!oldPassword || !password) {
        return res.status(400).json({
            message: 'Both oldPassword and new password fields are required'
        });
    }

    try {
        // Ensure user exist
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User does not exist" });
        }

        const validateOldPwd = await comparePwd({ email: user.email, password: oldPassword }, User);
        if (!validateOldPwd) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const hashedPassword = await hashPwd(password);
        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            message: "Password updated successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error
                ? error.message
                : "Failed to update password",
        });
    }
}
/**
 * @swagger
 * /users/forget_password:
 *   post:
 *     summary: Reset user password
 *     description: Allows a user to reset their password. The password will be hashed and updated in the database.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: The user's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 example: MyNewPassword123
 *                 description: The new password to set
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
 *         description: Bad request (missing email or password)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email and Password field are required
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User does not exist
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to update password
 */


import { hashPwd } from "../../../middleware/comparePwd.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyParam {
    email: string;
    password: string;
}

export const forgetPassword = async (req: Request<{}, any, BodyParam>, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and Password field are required'
        })
    }

    try {
        // Ensure user exist
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({ error: "User does not exist" });
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
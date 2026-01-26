/**
 * @swagger
 * /users/verify_email:
 *   post:
 *     summary: Verify user email
 *     description: Verify a user's email using the 4-digit verification code sent to their email.
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
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: The user's email address
 *               code:
 *                 type: string
 *                 example: "1234"
 *                 description: The 4-digit verification code sent to the user's email
 *     responses:
 *       200:
 *         description: Email verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verification Successful
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Missing email or invalid/expired verification code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code has expired.
 *       404:
 *         description: User or verification code not found
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
 *                   example: Failed to verify email
 */

import { generateToken } from "../../../middleware/generateToken.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";
import { VerificationCode } from "../../../models/users/verificationCode.js";

interface BodyParam {
    email: string;
    code: string
}

export const verifyEmail = async (req: Request<{}, any, BodyParam>, res: Response) => {
    const { email, code } = req.body;

    if (!email) {
        return res.status(400).json({
            message: 'Email field is required'
        })
    }

    try {
        // Ensure user exist
        const user = await User.findOne({ email }).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User does not exist" });
        }

        const emailEntry = await VerificationCode.findOne({ email });
        if (!emailEntry) {
            return res.status(404).json({ message: 'No verification code found for this email.' });
        }
        // Check if the provided code matches
        if (emailEntry.code !== code) {
            return res.status(400).json({ message: 'Invalid verification code.' });
        }
        // Check if the code has expired
        if (Date.now() > emailEntry.codeExpiration.getTime()) {
            return res.status(400).json({ message: 'Verification code has expired.' });
        }

        await VerificationCode.findOneAndDelete({ email });

        const token = generateToken(user._id.toString())
        return res.status(200).json({
            message: "Email verification Successful",
            data: user,
            token: token
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error
                ? error.message
                : "Failed to verify email",
        });
    }
}
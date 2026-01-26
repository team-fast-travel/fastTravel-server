/**
 * @swagger
 * /users/send_verification_code:
 *   post:
 *     summary: Send a verification code to user email
 *     description: Sends a 4-digit verification code to the provided email. If an entry exists, it updates the code and expiration.
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: The user's email address to send the verification code
 *     responses:
 *       201:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code sent
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     code:
 *                       type: string
 *                       example: "1234"
 *                     codeExpiration:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-19T20:15:30Z"
 *       400:
 *         description: Bad request (e.g., missing email)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email field is required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to login
 */

import crypto from "crypto";
import express from "express";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Request, Response } from "express";
import bodyParser from "body-parser";
import { VerificationCode } from "../../../models/users/verificationCode.js";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Nodemailer setup
let transporter: Transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_RECIEVE,
        pass: process.env.EMAIL_PWD
    }
})

// Function to generate a random 6-digit code
function generateCode(): string {
    return crypto.randomInt(1000, 10000).toString();
}

interface BodyParam {
    email: string;
}

export const sendVerificationCode = async (req: Request<{}, any, BodyParam>, res: Response) => {
    const { email } = req.body;

    try {
        let emailEntry = await VerificationCode.findOne({ email });

        // If the email already exists, update the code and expiration
        if (emailEntry) {
            const verificationCode = generateCode();
            emailEntry.code = verificationCode;
            emailEntry.codeExpiration = new Date(Date.now() + 10 * 60 * 1000);
            await emailEntry.save();
        } else {
            // If the email doesn't exist, create a new entry
            const verificationCode = generateCode();
            emailEntry = await VerificationCode.create({
                email: email,
                code: verificationCode,
                codeExpiration: new Date(Date.now() + 10 * 60 * 1000)
            });
        }

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_RECIEVE,
            to: email,
            subject: `Verification Code`,
            text: `Your verification code is ${emailEntry.code}. This code is valid for 10 minutes.`
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        return res.status(201).json({
            message: 'Verification code sent',
            data: emailEntry
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error
                ? error.message
                : "Failed to login",
        });
    }
}
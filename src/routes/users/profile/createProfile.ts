import { getSocket } from "../../../config/connection.js";
import { Profile } from "../../../models/users/profile.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";
import multer from "multer";
import { supabase } from "../../../config/supabaseConfig.js";

/**
 * @swagger
 * /create_profile:
 *   post:
 *     tags: [Profile]
 *     summary: Create or update profile image
 *     description: |
 *       Uploads a profile image for the authenticated user.
 *       - If a profile already exists, it updates the image and returns 200.
 *       - If no profile exists, it creates one and returns 201.
 *       Emits socket events:
 *       - "profile_updated" when updated
 *       - "new_profile" when created
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (max 5MB)
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile image updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       201:
 *         description: Profile image created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile image created successfully
 *                 profile:
 *                   $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Failed to upload image (Supabase error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to upload image
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized / missing image
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               unauthorized:
 *                 value:
 *                   message: User not authorized
 *               missingImage:
 *                 value:
 *                   message: Image path is required
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to create profile
 *
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 65a1b2c3d4e5f67890123456
 *         userId:
 *           type: string
 *           example: 695c30fa2fa6c42473d4e51d
 *         image:
 *           type: string
 *           example: https://xxxxx.supabase.co/storage/v1/object/public/fast/user/profile/...
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */


interface ProfileBody {
    image: string
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
})

export const uploadProfileImage = upload.single("image");

export const createProfile = async (req: Request<{}, any, ProfileBody>, res: Response) => {
    const userId = req.user.userId;
    const image = req.file;

    if (!userId) {
        return res.status(401).json({
            message: 'User not authorized'
        })
    }

    if (!image) {
        return res.status(401).json({
            message: 'Image path is required'
        })
    }

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        // Uploading image
        const fileName = `${Date.now()}-${image.originalname}`;
        const filePath = `user/profile/${user._id}/${fileName}`;

        const bucket = "fast";

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, image.buffer, {
                contentType: image.mimetype,
                upsert: true,
            });

        if (uploadError) {
            return res.status(400).json({ message: "Failed to upload image", error: uploadError.message });
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const profile = await Profile.findOne({ userId })
        if (profile) {
            profile.image = publicUrl;
            await profile.save();

            const io = getSocket();
            if (io) {
                io.to(userId.toString()).emit("profile_updated", profile);
            }

            return res.status(200).json({
                message: "Profile image updated successfully",
                data: profile,
            });
        } else {
            const newProfile = await Profile.create({
                userId,
                image: publicUrl
            });

            const io = getSocket();
            if (io) {
                io.to(userId.toString()).emit("new_profile", newProfile);
            }

            return res.status(201).json({
                message: "Profile image created successfully",
                profile: newProfile,
            });
        }
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to create profile",
        });
    }
}
import { getSocket } from "../../../config/connection.js";
import { Profile } from "../../../models/users/profile.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const deleteProfile = async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const profileId = req.params;

    if (!userId) {
        return res.status(401).json({
            message: 'User not authorized'
        })
    }
    if (!profileId) {
        return res.status(404).json({
            message: 'All field is required'
        })
    }

    try {
        // Ensure User exist
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                message: 'Account not found'
            })
        }

        const deleteProfile = await Profile.findByIdAndDelete(profileId);
        if (!deleteProfile) {
            return res.status(400).json({
                message: 'Profile image doesn\'t exist'
            })
        }

        const io = getSocket()
        if (io) {
            io.to('fastTravel_global_room').emit('delete_profile', deleteProfile)
        }

        return res.status(200).json({
            message: 'Profile image deleted successfully',
            data: deleteProfile
        })
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to create profile",
        });
    }
}
import bcrypt from "bcrypt";
import type { Model, Document } from "mongoose";

interface LoginInput {
    email: string;
    password: string;
}

export const comparePwd = async<T extends Document & { email: string; password: string }>(id: LoginInput, model: Model<T>): Promise<boolean> => {
    const user = await model
        .findOne({ email: id.email })
        .select("+password")
        .exec();

    if (!user) {
        throw new Error("User not found");
    }

    return bcrypt.compare(id.password, user.password);
};

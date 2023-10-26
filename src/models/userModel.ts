import { ObjectId } from "mongodb";
import mongoose from "mongoose";

interface IUser {
    _id: ObjectId,
    has_labels: boolean,
    activity_ids: string[]
}

export interface UserDoc extends mongoose.Document {
    _id: IUser["_id"],
    has_labels: IUser["has_labels"],
    activity_ids: IUser["has_labels"]
}

export interface UserModelInterface extends mongoose.Model<UserDoc> {
    build(attr: IUser): UserDoc
}

const userSchema = new mongoose.Schema<UserDoc> (
    {
        _id: {
            type: ObjectId,
            required: true
        },
        has_labels: {
            type: Boolean,
            default: false
        },
        activity_ids: [
            {
                type: String
            }
        ]
    },
    {collection: "user", _id: false}
)

userSchema.statics.build = (attr: IUser) => {
    return new User(attr);
}


const User = mongoose.model<UserDoc, UserModelInterface>("user", userSchema)

export default User
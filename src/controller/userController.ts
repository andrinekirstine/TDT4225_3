import User, { IUser, UserDoc } from "../models/userModel";

export const addUsers = async(userId: string, labels: boolean, activityIds: string[]) => {
    if (userId === undefined || !userId) {
        return console.log("Need userId")
    }
    if (activityIds === undefined || activityIds.length <= 0) {
        return console.error("Need activity ids")
    }

    const newUser: IUser = {
        _id: userId,
        has_labels: labels,
        activity_ids: activityIds
    }

    const resUser: UserDoc = User.build(newUser);  
    resUser.save()
    
    return console.log(`${resUser._id} is added`)
};
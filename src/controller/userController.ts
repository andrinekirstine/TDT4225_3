import User, { IUser, UserDoc } from "../models/userModel";

const labelList: string[] = [ "010", "020", "021", "052", "053", "056", "058", "059", "060", "062",
    "064", "065", "067", "068", "069", "073", "075", "076", "078", "080",
    "081", "082", "084", "085", "086", "087", "088", "089", "091", "092",
    "096", "097", "098", "100", "101", "102", "104", "105", "106", "107",
    "108", "110", "111", "112", "114", "115", "116", "117", "118", "124",
    "125", "126", "128", "129", "136", "138", "139", "141", "144", "147",
    "153", "154", "161", "163", "167", "170", "174", "175", "179"];


export const addUsers = async(userId: string, activityIds: string[]) => {
    if (userId === undefined || !userId) {
        return console.log("Need userId")
    }
    if (activityIds === undefined || activityIds.length <= 0) {
        return console.error("Need activity ids")
    }

    const labels: boolean = labelList.includes(userId)

    const newUser: IUser = {
        _id: userId,
        has_labels: labels,
        activity_ids: activityIds
    }

    const resUser: UserDoc = User.build(newUser);  
    resUser.save()
    
    return console.log(`${resUser._id} is added`)
};
import User, { UserDoc } from "../models/userModel";

const addUsers = async(reqUser: UserDoc) => {
    if (reqUser === undefined || !reqUser) {
        return console.log("Need an input")
    }

    const resUser: UserDoc = User.build(reqUser);  
    resUser.save()
    
    return resUser._id
};
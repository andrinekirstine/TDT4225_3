import Activity, { ActivityDoc } from "../models/activityModel";

const addActivity = async(reqActivity: ActivityDoc) => {
    if(reqActivity === undefined || !reqActivity) {
        return console.log("Need an input")
    }
    const resActivity: ActivityDoc = await Activity.build(reqActivity)
    resActivity.save()
  
    return resActivity._id
};
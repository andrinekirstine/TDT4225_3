import Activity, { ActivityDoc, IActivity } from "../models/activityModel";
import TrackPoint, { TrackPointDoc } from "../models/trackPointModel";

export const addActivity = async(tpId: string[]) => {
    if(tpId === undefined || tpId.length <= 0) {
        return console.error("Missing tp ids")
    }
    const tps: TrackPointDoc[] = await TrackPoint.find({ '_id': { $in: tpId}}).exec()
    if(tps.length <= 0) {
        return console.error("Can not find tps")
    }

    const newActivity: IActivity = {
        transportation_mode: undefined,
        start_date_time: tps[0].date,
        end_date_time: tps[-1].date,
        trackpoint_ids: tpId
    }

    const resActivity: ActivityDoc = await Activity.build(newActivity)
    resActivity.save()
  
    return resActivity._id
};

interface Labels {
    start_time: Date,
    end_time: Date,
    transport_mode: string
}

// Take in the list of labels and the list of activity ids from the user
export const setTransport = async (labelList: Labels[], activity_ids: string[]) => {
    if(labelList.length <= 0 ) {
        return console.error("Missing label list");
    }
    if(activity_ids.length <= 0 ) {
        return console.error("Missing activity id list");
    }

    const activities: ActivityDoc[] | null = await Activity.find({ '_id': { $in: activity_ids}}).exec()

    if(activities === null || activities.length <= 0) {
        return console.error("cannot find ids")
    }

    let labelAcivity: Labels[]

    activities.forEach(async (activity) => {
        const label: Labels[] = labelList.filter(label => {
            label.start_time.getTime() === activity.start_date_time.getTime() &&
            label.end_time.getTime() === activity.end_date_time.getTime() 
        })
        if(label.length > 0) {
            const updateActive = await Activity.findByIdAndUpdate({'_id': activity._id }, {transportation_mode: label[0].transport_mode})
        };
    })
}
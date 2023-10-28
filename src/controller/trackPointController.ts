import TrackPoint, { ITrackPoint, TrackPointDoc } from "../models/trackPointModel";

export const addTrackPoints = async(trackPoints: ITrackPoint[]) => {
    if(trackPoints.length === 0 || !trackPoints) {
        throw new Error("error")
    }

    const tp: TrackPointDoc[] = await TrackPoint.insertMany(trackPoints)
    
    if(tp.length === 0) {
        throw new Error("error")
    }
    const id: string[] = tp.map(t => t._id)

    if(id.length === 0) {
        throw new Error("error")
    }

    return id
};
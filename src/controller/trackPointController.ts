import TrackPoint, { TrackPointDoc } from "../models/trackPointModel";

const addTrackPoints = async(trackPoints: TrackPointDoc[]) => {
    if(trackPoints.length === 0 || !trackPoints) {
        return console.log("Need an input")
    }

    const tp: TrackPointDoc[] = await TrackPoint.insertMany(trackPoints)
    
    if(tp.length === 0) {
        return console.log("Error no TP added")
    }
    const id: string[] = tp.map(t => t._id)

    if(id.length === 0) {
        return console.log("Error can not find _IDs")
    }

    return id
};
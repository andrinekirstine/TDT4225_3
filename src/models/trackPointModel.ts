import mongoose from "mongoose";

export interface ITrackPoint {
    lat: number, 
    lon: number,
    altitude: number,
    date: Date
}

export interface TrackPointDoc extends mongoose.Document {
    lat: ITrackPoint["lat"],
    lon: ITrackPoint["lon"],
    altitude: ITrackPoint["altitude"],
    date: ITrackPoint["date"]    
}

export interface TrackPointModelInterface extends mongoose.Model<TrackPointDoc> {
    build(attr: ITrackPoint): TrackPointDoc
}

const trackPointSchema = new mongoose.Schema<TrackPointDoc> (
    {
        lat: {
            type: Number,
            required: true
        },
        lon: {
            type: Number,
            required: true
        },
        altitude:{
            type: Number,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
    },
    {collection: "trackPoint"}
)

trackPointSchema.statics.build = (attr: ITrackPoint) => {
    return new TrackPoint(attr);
}


const TrackPoint = mongoose.model<TrackPointDoc, TrackPointModelInterface>("trackPoint", trackPointSchema)

export default TrackPoint
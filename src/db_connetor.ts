import mongoose from "mongoose";

export const initializeConfig = () => {
    mongoose.connect("mongodb://root:mongo-pass@localhost:27017/?authMechanism=DEFAULT")
        .then(() => {
            console.log("Connected")
        })
        .catch((error) => {
            console.log(error)
        })
};
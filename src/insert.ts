import { walk } from "node-os-walk";
import path from "path";
import fs from 'fs';
import { ITrackPoint } from "./models/trackPointModel";
import { addTrackPoints } from "./controller/trackPointController";
import { Labels, addActivity, setTransport } from "./controller/activityController";
import { addActivityToUser, addUser, findUsers, updateHasLabel } from "./controller/userController";
import { initializeConfig } from "./db_connetor";
import { ObjectId } from "mongodb";
import { UserDoc } from "./models/userModel";

const PROCESSED_FILES_PATH: string = ".processed_files"

interface ActivityPath {
    user: string,
    path: string
}

initializeConfig()

async function walkDataset(rootPath: string): Promise<ActivityPath[]> {
    let activities: ActivityPath[] = []
    for await (const [root, dirs, files] of walk(rootPath)) {
        for (const file of files) {

            const absolutePath = path.resolve(root, file.name);
            let belongsTo: string;
            if(file.name === "labels.txt") {
                continue;
            } else {
                belongsTo = path.basename(path.dirname(path.dirname(absolutePath)));
            }
            activities.push({
                user: belongsTo,
                path: absolutePath
            });
        }
      }
      return activities;
}

async function getLabels(user: string, rootPath: string): Promise<Labels[] | null> {
    const absolutePath = path.resolve(rootPath, user, "labels.txt");
    if (!fs.existsSync(absolutePath)) {
        return null;
    }
    return fs.readFileSync(absolutePath, "utf8").split("\r\n").slice(1).map(l => {
        const [start_time, end_time, transport_mode] = l.split("\t")
        return {
            start_time: new Date(start_time),
            end_time: new Date(end_time),
            transport_mode: transport_mode
        };
    });
}

function usersWithLabels(): string[] {
    const labelListPath = path.resolve("./dataset/out/labeled_ids.txt");

    const labelList: string[] = fs.readFileSync(labelListPath, "utf8")
        .split("\n").filter((s) => s !== "");

    return labelList;
}

function getProcessedFiles(): string[] {
    try {
        return fs.readFileSync(PROCESSED_FILES_PATH, "utf8").split("\n").filter(s => s !== "");
    } catch {
        return [];
    }

}

function markFileAsProcessed(path: string) {
    fs.appendFileSync(PROCESSED_FILES_PATH, path + "\n", "utf8")
}

async function addLabels() {
    const rootPath = path.resolve("./dataset/out/Data");
    const labeledUsers: UserDoc[] = await findUsers()
    for (const user of labeledUsers) {
        console.log(`Prossesing: ${user._id}`)
        const labels: Labels[] | null = await getLabels(user._id.toString(), rootPath)
        if(labels !== null){
           await setTransport(labels, user.activity_ids)
        }
    }
}

async function main() {
    // The root path of our data.
    const rootPath = path.resolve("./dataset/out/Data");

    // Read the list of users that has labels.
    const labelList: string[] = usersWithLabels();

    // Get the list of already processed files.
    const processedFiles: string[] = getProcessedFiles();

    // Get a list of all the files in the dataset with their corresponding user.
    const dataset: ActivityPath[] = await walkDataset(rootPath).then(d => {
        return d.filter(a => !processedFiles.includes(a.path))
    });

    for (const activity of dataset) {

        console.log("Processing:", activity.user, activity.path);

        const user = await addUser(activity.user)
        

        const content = fs.readFileSync(activity.path, "utf-8")   
        const lines = content.split('\n');
        const tpData: ITrackPoint[] = []

        for (const line of lines) {
            const [lat, lon, altitude, dateStr] = line.trim().split(',');

            const latitude1 = parseFloat(lat);
            const longitude1 = parseFloat(lon);
            const alt1 = parseFloat(altitude);
            const date1 = new Date(dateStr);
            const _id = new ObjectId()

            tpData.push({ _id: _id, lat: latitude1, lon: longitude1, altitude: alt1, date: date1 });
        }
        
        const trackPoint_ids = await addTrackPoints(tpData)
        
        const activity_id: ObjectId = await addActivity(trackPoint_ids)
        const a = activity_id.toString()
        await addActivityToUser(activity.user, a);

        // 2: Create an activity with the trackpoint ids and get the activity ID.

        // 3: Create the user if it does not exist and add the activity to it.

        // If everything went correcly, we write the file as complete to the processed files.
        markFileAsProcessed(activity.path)
    }
}

//main();

addLabels()
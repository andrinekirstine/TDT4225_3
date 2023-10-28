import { walk } from "node-os-walk";
import path from "path";
import fs from 'fs';

const PROCESSED_FILES_PATH: string = ".processed_files"

interface ActivityPath {
    user: string,
    path: string
}

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

async function getLabels(user: string, rootPath: string): Promise<string | null> {
    const absolutePath = path.resolve(rootPath, user);
    if (!fs.existsSync(absolutePath)) {
        return null;
    }
    return fs.readFileSync(absolutePath, "utf8");
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
        const userHasLabels: boolean = labelList.includes(activity.user);

        console.log("Processing:", activity.user, activity.path);
        // 0: Read file and create objects from the text. 
        //      tips: fs.readSync(user.path, "utf8")

        // 1: Create trackpoints and get their corresponding IDs.
        
        // 2: Create an activity with the trackpoint ids and get the activity ID.

        // 3: Create the user if it does not exist and add the activity to it.

        // If everything went correcly, we write the file as complete to the processed files.
        markFileAsProcessed(activity.path)
    }
}

main();